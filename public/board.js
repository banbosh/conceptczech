/* ============================================================
   BOARD MODULE — Nastenka
   ============================================================ */
const Board = (() => {
  let unsubscribe = null;
  let posts = [];
  let detailPostId = null;
  let readPosts = JSON.parse(localStorage.getItem('cc_read_posts') || '[]');

  function render() {
    if (detailPostId) {
      renderDetail(detailPostId);
      return;
    }
    renderList();
  }

  function renderList() {
    const container = document.getElementById('view-board');
    const profile = Auth.getProfile();

    container.innerHTML = `<h1 class="page-title">${App.t('boardTitle')}</h1><div class="spinner"></div>`;

    if (unsubscribe) unsubscribe();

    unsubscribe = db.collection('board')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => {
        posts = [];
        snap.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));

        // Filter by role visibility
        const visible = posts.filter(p => {
          if (!p.roles || p.roles.length === 0) return true;
          if (p.roles.includes('all')) return true;
          if (profile && p.roles.includes(profile.role)) return true;
          if (profile && Auth.isAdmin(profile)) return true;
          return false;
        });

        // Update badges
        updateBadge(visible);

        if (visible.length === 0) {
          container.innerHTML = `<h1 class="page-title">${App.t('boardTitle')}</h1>
            <div class="empty-state"><div class="empty-state-text">${App.t('noPosts')}</div></div>`;
          return;
        }

        let html = `<h1 class="page-title">${App.t('boardTitle')}</h1>`;
        html += visible.map(post => {
          const isRead = readPosts.includes(post.id);
          return `<div class="card board-card" data-post-id="${post.id}" style="cursor:pointer;${!isRead ? 'border-left:4px solid var(--accent)' : ''}">
            <div class="board-card-inner">
              ${post.imageUrl ? `<img src="${App.escapeHtml(post.imageUrl)}" class="board-thumb" alt="">` : '<div class="board-thumb board-thumb-placeholder"></div>'}
              <div class="board-card-body">
                <div class="card-title">${App.escapeHtml(post.title)}</div>
                <div class="card-meta">${App.escapeHtml(post.authorName || '')} &middot; ${App.formatDateTime(post.createdAt)}</div>
                <div class="card-body">${App.escapeHtml(post.content || '').substring(0, 120)}${(post.content || '').length > 120 ? '...' : ''}</div>
              </div>
            </div>
          </div>`;
        }).join('');

        container.innerHTML = html;

        container.querySelectorAll('.card[data-post-id]').forEach(card => {
          card.addEventListener('click', () => {
            detailPostId = card.dataset.postId;
            markAsRead(detailPostId);
            renderDetail(detailPostId);
          });
        });
      });
  }

  function renderDetail(postId) {
    const container = document.getElementById('view-board');
    const post = posts.find(p => p.id === postId);
    if (!post) {
      detailPostId = null;
      renderList();
      return;
    }

    const profile = Auth.getProfile();
    const isAdm = Auth.isAdmin(profile);

    let html = `
      <button class="detail-back" id="board-back">&larr; ${App.t('back')}</button>
      <div class="card">
        <h2 class="card-title" style="font-size:1.1rem">${App.escapeHtml(post.title)}</h2>
        <div class="card-meta">${App.escapeHtml(post.authorName || '')} &middot; ${App.formatDateTime(post.createdAt)}</div>
        ${post.imageUrl ? `<img src="${App.escapeHtml(post.imageUrl)}" style="width:100%;border-radius:var(--radius);margin:12px 0;max-height:400px;object-fit:cover" alt="">` : ''}
        <div class="card-body mt-8" style="white-space:pre-wrap">${App.escapeHtml(post.content || '')}</div>
        ${isAdm ? `<div class="mt-16"><button class="btn btn-sm btn-danger" id="board-delete">${App.t('delete')}</button></div>` : ''}
      </div>`;

    html += `<div class="comments-section" id="board-comments"><div class="spinner"></div></div>`;
    html += `<div class="comment-input-row mt-8">
      <input class="form-input" id="board-comment-input" placeholder="${App.t('comment')}...">
      <button class="btn btn-sm btn-primary" id="board-comment-add">${App.t('addComment')}</button>
    </div>`;

    container.innerHTML = html;

    container.querySelector('#board-back').addEventListener('click', () => {
      detailPostId = null;
      renderList();
    });

    const delBtn = container.querySelector('#board-delete');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (confirm(App.t('delete') + '?')) {
          await db.collection('board').doc(postId).delete();
          App.logActivity('board_delete', post.title);
          detailPostId = null;
          renderList();
        }
      });
    }

    Tasks.loadComments(postId, 'board', container.querySelector('#board-comments'));

    container.querySelector('#board-comment-add').addEventListener('click', () => {
      const input = container.querySelector('#board-comment-input');
      if (input.value.trim()) {
        Tasks.addComment(postId, 'board', input.value.trim());
        input.value = '';
      }
    });

    container.querySelector('#board-comment-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') container.querySelector('#board-comment-add').click();
    });
  }

  function showAddModal() {
    const roles = App.ROLES;

    let roleCheckboxes = `<label style="display:block;margin-bottom:4px">
      <input type="checkbox" value="all" checked> ${App.t('visAll')}</label>`;
    roles.forEach(r => {
      roleCheckboxes += `<label style="display:block;margin-bottom:4px">
        <input type="checkbox" value="${r}"> ${App.roleLabel(r)}</label>`;
    });

    const html = `
      <div class="modal-header">
        <h3 class="modal-title">${App.t('addPost')}</h3>
        <button class="modal-close" id="modal-close-btn">&times;</button>
      </div>
      <div class="form-group">
        <label class="form-label">${App.t('postTitle')}</label>
        <input class="form-input" id="new-post-title" required>
      </div>
      <div class="form-group">
        <label class="form-label">${App.t('postContent')}</label>
        <textarea class="form-textarea" id="new-post-content" rows="5"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Náhledový obrázek</label>
        <div id="board-img-preview" style="display:none;margin-bottom:8px">
          <img id="board-img-preview-img" src="" style="width:100px;height:100px;object-fit:cover;border-radius:8px;border:1px solid #e0e0e0">
        </div>
        <label class="btn btn-outline btn-sm" for="board-img-file" style="display:inline-block;cursor:pointer">Nahrát obrázek</label>
        <input type="file" id="board-img-file" accept="image/*" style="display:none">
        <input class="form-input" id="new-post-image" placeholder="nebo URL obrázku" style="margin-top:8px">
      </div>
      <div class="form-group">
        <label class="form-label">${App.t('postVisibility')}</label>
        <div id="post-roles">${roleCheckboxes}</div>
      </div>
      <div class="flex gap-8">
        <button class="btn btn-primary flex-1" id="save-post-btn">${App.t('save')}</button>
        <button class="btn btn-outline" id="cancel-post-btn">${App.t('cancel')}</button>
      </div>`;

    App.openModal(html);
    document.getElementById('modal-close-btn').addEventListener('click', App.closeModal);
    document.getElementById('cancel-post-btn').addEventListener('click', App.closeModal);
    document.getElementById('save-post-btn').addEventListener('click', savePost);

    // Náhled obrázku při výběru souboru
    document.getElementById('board-img-file').addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        // Zmenši obrázek na max 400px
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const maxSize = 400;
          let w = img.width, h = img.height;
          if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize; } }
          else { if (h > maxSize) { w = w * maxSize / h; h = maxSize; } }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          document.getElementById('new-post-image').value = dataUrl;
          document.getElementById('board-img-preview-img').src = dataUrl;
          document.getElementById('board-img-preview').style.display = 'block';
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function savePost() {
    const title = document.getElementById('new-post-title').value.trim();
    if (!title) return;

    const rolesEls = document.querySelectorAll('#post-roles input[type="checkbox"]:checked');
    const roles = Array.from(rolesEls).map(el => el.value);

    const profile = Auth.getProfile();
    await db.collection('board').add({
      title,
      content: document.getElementById('new-post-content').value.trim(),
      imageUrl: document.getElementById('new-post-image').value.trim(),
      roles,
      author: profile.id,
      authorName: profile.displayName || profile.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    App.logActivity('board_create', title);
    App.closeModal();
    App.toast(App.t('addPost') + ': ' + title, 'success');
  }

  function markAsRead(postId) {
    if (!readPosts.includes(postId)) {
      readPosts.push(postId);
      localStorage.setItem('cc_read_posts', JSON.stringify(readPosts));
    }
  }

  function updateBadge(visible) {
    const unread = visible.filter(p => !readPosts.includes(p.id)).length;
    const badges = [document.getElementById('board-badge-sidebar')];
    badges.forEach(b => {
      if (!b) return;
      if (unread > 0) {
        b.textContent = unread;
        b.classList.remove('hidden');
      } else {
        b.classList.add('hidden');
      }
    });
  }

  return { render, showAddModal };
})();
