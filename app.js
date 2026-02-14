/* ============================================
   Novel Progress Manager - Application Logic
   ============================================ */

(function () {
  "use strict";

  // ---- Utility ----
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  }

  function formatNumber(n) {
    return n != null ? n.toLocaleString("ja-JP") : "0";
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  // ---- Storage ----
  const STORAGE_KEY = "novel_progress_projects";

  function loadProjects() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveProjects(projects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  // ---- State ----
  let projects = loadProjects();
  let currentProjectId = null;
  let editingProjectId = null;
  let editingPlotId = null;
  let confirmCallback = null;

  // ---- DOM Elements ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const headerTitle = $("#headerTitle");
  const newProjectBtn = $("#newProjectBtn");

  const projectListView = $("#projectListView");
  const emptyState = $("#emptyState");
  const projectGrid = $("#projectGrid");

  const projectDetailView = $("#projectDetailView");
  const backBtn = $("#backBtn");
  const editProjectBtn = $("#editProjectBtn");
  const deleteProjectBtn = $("#deleteProjectBtn");
  const detailInfo = $("#detailInfo");

  const wordCountSection = $("#wordCountSection");
  const currentWordCountInput = $("#currentWordCount");
  const updateWordCountBtn = $("#updateWordCountBtn");
  const wordCountProgress = $("#wordCountProgress");
  const wordCountHistory = $("#wordCountHistory");

  const plotSection = $("#plotSection");
  const addPlotBtn = $("#addPlotBtn");
  const plotProgress = $("#plotProgress");
  const plotList = $("#plotList");

  const projectModal = $("#projectModal");
  const modalTitle = $("#modalTitle");
  const modalCloseBtn = $("#modalCloseBtn");
  const projectForm = $("#projectForm");
  const cancelFormBtn = $("#cancelFormBtn");

  const plotModal = $("#plotModal");
  const plotModalTitle = $("#plotModalTitle");
  const plotModalCloseBtn = $("#plotModalCloseBtn");
  const plotForm = $("#plotForm");
  const cancelPlotBtn = $("#cancelPlotBtn");

  const confirmModal = $("#confirmModal");
  const confirmMessage = $("#confirmMessage");
  const confirmCancelBtn = $("#confirmCancelBtn");
  const confirmOkBtn = $("#confirmOkBtn");

  // ---- Helpers ----
  function getProject(id) {
    return projects.find((p) => p.id === id);
  }

  function persist() {
    saveProjects(projects);
  }

  function getModeLabel(mode) {
    switch (mode) {
      case "wordcount": return "文字数ベース";
      case "plot": return "プロットベース";
      case "both": return "文字数 + プロット";
      default: return mode;
    }
  }

  function calcPlotProgress(project) {
    if (!project.plots || project.plots.length === 0) return 0;
    const done = project.plots.filter((p) => p.completed).length;
    return Math.round((done / project.plots.length) * 100);
  }

  function calcWordProgress(project) {
    if (!project.targetWordCount || project.targetWordCount <= 0) return null;
    const pct = Math.min(100, Math.round((project.currentWordCount / project.targetWordCount) * 100));
    return pct;
  }

  function calcOverallProgress(project) {
    const mode = project.progressMode;
    if (mode === "wordcount") {
      return calcWordProgress(project);
    } else if (mode === "plot") {
      return calcPlotProgress(project);
    } else {
      const wp = calcWordProgress(project);
      const pp = calcPlotProgress(project);
      if (wp == null) return pp;
      return Math.round((wp + pp) / 2);
    }
  }

  // ---- Rendering: Project List ----
  function renderProjectList() {
    if (projects.length === 0) {
      emptyState.style.display = "";
      projectGrid.style.display = "none";
      return;
    }
    emptyState.style.display = "none";
    projectGrid.style.display = "";

    projectGrid.innerHTML = projects
      .map((p) => {
        const progress = calcOverallProgress(p);
        const days = daysUntil(p.deadline);
        let deadlineClass = "deadline";
        if (days !== null && days < 0) deadlineClass += " overdue";

        let deadlineTag = "";
        if (p.deadline) {
          const label = days === null ? "" : days < 0 ? `(${Math.abs(days)}日超過)` : days === 0 ? "(今日)" : `(残り${days}日)`;
          deadlineTag = `<span class="meta-tag ${deadlineClass}">${formatDate(p.deadline)} ${label}</span>`;
        }

        let wordTag = "";
        if (p.targetWordCount) {
          wordTag = `<span class="meta-tag">${formatNumber(p.currentWordCount)} / ${formatNumber(p.targetWordCount)}字</span>`;
        }

        const progressPct = progress != null ? progress : 0;
        const fillClass = progressPct >= 100 ? "complete" : "";

        return `
          <div class="project-card" data-id="${p.id}">
            <div class="project-card-title">${escapeHtml(p.title)}</div>
            ${p.description ? `<div class="project-card-desc">${escapeHtml(p.description)}</div>` : ""}
            <div class="project-card-meta">
              <span class="meta-tag mode">${getModeLabel(p.progressMode)}</span>
              ${deadlineTag}
              ${wordTag}
            </div>
            <div class="project-card-progress">
              <div class="progress-mini-label">
                <span>進捗</span>
                <span>${progress != null ? progress + "%" : "---"}</span>
              </div>
              <div class="progress-bar progress-bar-mini">
                <div class="progress-fill ${fillClass}" style="width:${progressPct}%"></div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    projectGrid.querySelectorAll(".project-card").forEach((card) => {
      card.addEventListener("click", () => {
        openProjectDetail(card.dataset.id);
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Rendering: Project Detail ----
  function openProjectDetail(id) {
    currentProjectId = id;
    projectListView.style.display = "none";
    projectDetailView.style.display = "";
    newProjectBtn.style.display = "none";
    renderProjectDetail();
  }

  function closeProjectDetail() {
    currentProjectId = null;
    projectDetailView.style.display = "none";
    projectListView.style.display = "";
    newProjectBtn.style.display = "";
    renderProjectList();
  }

  function renderProjectDetail() {
    const p = getProject(currentProjectId);
    if (!p) {
      closeProjectDetail();
      return;
    }

    // Detail info
    const days = daysUntil(p.deadline);
    let deadlineHtml = "";
    if (p.deadline) {
      let dayLabel = "";
      if (days < 0) dayLabel = `<span style="color:var(--color-danger)">(${Math.abs(days)}日超過)</span>`;
      else if (days === 0) dayLabel = `<span style="color:var(--color-accent)">(今日)</span>`;
      else dayLabel = `(残り${days}日)`;
      deadlineHtml = `
        <div class="detail-meta-item">
          <strong>締め切り:</strong> ${formatDate(p.deadline)} ${dayLabel}
        </div>`;
    }

    let targetHtml = "";
    if (p.targetWordCount) {
      targetHtml = `
        <div class="detail-meta-item">
          <strong>目標文字数:</strong> ${formatNumber(p.targetWordCount)}字
        </div>`;
    }

    detailInfo.innerHTML = `
      <div class="detail-title">${escapeHtml(p.title)}</div>
      ${p.description ? `<div class="detail-description">${escapeHtml(p.description)}</div>` : ""}
      <div class="detail-meta">
        <div class="detail-meta-item">
          <strong>モード:</strong> ${getModeLabel(p.progressMode)}
        </div>
        ${deadlineHtml}
        ${targetHtml}
        <div class="detail-meta-item">
          <strong>作成日:</strong> ${formatDate(p.createdAt)}
        </div>
      </div>
    `;

    // Word Count Section
    if (p.progressMode === "wordcount" || p.progressMode === "both") {
      wordCountSection.style.display = "";
      currentWordCountInput.value = p.currentWordCount || 0;
      renderWordCountProgress(p);
      renderWordCountHistory(p);
    } else {
      wordCountSection.style.display = "none";
    }

    // Plot Section
    if (p.progressMode === "plot" || p.progressMode === "both") {
      plotSection.style.display = "";
      renderPlotProgress(p);
      renderPlotList(p);
    } else {
      plotSection.style.display = "none";
    }
  }

  function renderWordCountProgress(p) {
    const pct = calcWordProgress(p);
    if (pct != null) {
      const fillClass = pct >= 100 ? "complete" : "";
      wordCountProgress.innerHTML = `
        <div class="progress-label">
          <span>${formatNumber(p.currentWordCount)} / ${formatNumber(p.targetWordCount)}字</span>
          <span>${pct}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${fillClass}" style="width:${pct}%"></div>
        </div>
      `;
    } else {
      wordCountProgress.innerHTML = `
        <div class="progress-label">
          <span>現在: ${formatNumber(p.currentWordCount)}字</span>
          <span>目標未設定</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:0%"></div>
        </div>
      `;
    }
  }

  function renderWordCountHistory(p) {
    if (!p.wordCountHistory || p.wordCountHistory.length === 0) {
      wordCountHistory.innerHTML = `
        <div class="wordcount-history-title">更新履歴</div>
        <p style="font-size:0.85rem;color:var(--color-text-muted);">まだ履歴がありません</p>
      `;
      return;
    }

    // Chart
    const chartHtml = renderMiniChart(p);

    const items = [...p.wordCountHistory].reverse().map((entry, i, arr) => {
      const prev = arr[i + 1];
      let diffHtml = "";
      if (prev) {
        const diff = entry.count - prev.count;
        if (diff > 0) {
          diffHtml = `<span class="history-diff positive">+${formatNumber(diff)}</span>`;
        } else if (diff < 0) {
          diffHtml = `<span class="history-diff negative">${formatNumber(diff)}</span>`;
        }
      }
      return `
        <li class="history-item">
          <span class="history-date">${formatDate(entry.date)}</span>
          <span>
            <span class="history-count">${formatNumber(entry.count)}字</span>
            ${diffHtml}
          </span>
        </li>
      `;
    });

    wordCountHistory.innerHTML = `
      <div class="wordcount-history-title">更新履歴</div>
      ${chartHtml}
      <ul class="history-list">${items.join("")}</ul>
    `;
  }

  function renderMiniChart(p) {
    if (!p.wordCountHistory || p.wordCountHistory.length < 2) return "";

    const data = p.wordCountHistory.slice(-20);
    const maxVal = Math.max(...data.map((d) => d.count), p.targetWordCount || 0) || 1;
    const width = 100;
    const height = 100;
    const padding = 5;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * chartW;
      const y = padding + chartH - (d.count / maxVal) * chartH;
      return `${x},${y}`;
    });

    const polyline = points.join(" ");

    // Area fill
    const areaPoints = `${padding},${padding + chartH} ${polyline} ${padding + chartW},${padding + chartH}`;

    // Target line
    let targetLine = "";
    if (p.targetWordCount) {
      const ty = padding + chartH - (p.targetWordCount / maxVal) * chartH;
      targetLine = `<line x1="${padding}" y1="${ty}" x2="${padding + chartW}" y2="${ty}" stroke="var(--color-accent)" stroke-width="0.5" stroke-dasharray="2,2"/>`;
    }

    return `
      <div class="chart-container">
        <svg class="chart-canvas" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
          <polygon points="${areaPoints}" fill="var(--color-primary-light)" opacity="0.5"/>
          <polyline points="${polyline}" fill="none" stroke="var(--color-primary)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
          ${targetLine}
        </svg>
      </div>
    `;
  }

  function renderPlotProgress(p) {
    const total = p.plots ? p.plots.length : 0;
    const done = p.plots ? p.plots.filter((pl) => pl.completed).length : 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const fillClass = pct >= 100 ? "complete" : "";

    plotProgress.innerHTML = `
      <div class="progress-label">
        <span>${done} / ${total} 項目完了</span>
        <span>${pct}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${fillClass}" style="width:${pct}%"></div>
      </div>
    `;
  }

  function renderPlotList(p) {
    if (!p.plots || p.plots.length === 0) {
      plotList.innerHTML = `<p style="font-size:0.85rem;color:var(--color-text-muted);">プロット項目がまだありません</p>`;
      return;
    }

    plotList.innerHTML = p.plots
      .sort((a, b) => a.order - b.order)
      .map((pl, idx) => {
        const checkedClass = pl.completed ? "checked" : "";
        const itemClass = pl.completed ? "completed" : "";
        return `
          <div class="plot-item ${itemClass}" data-plot-id="${pl.id}" draggable="true">
            <span class="drag-handle" title="ドラッグで並び替え">⠿</span>
            <span class="plot-order">${idx + 1}</span>
            <div class="plot-checkbox ${checkedClass}" data-plot-id="${pl.id}"></div>
            <div class="plot-content">
              <div class="plot-item-title">${escapeHtml(pl.title)}</div>
              ${pl.description ? `<div class="plot-item-desc">${escapeHtml(pl.description)}</div>` : ""}
            </div>
            <div class="plot-item-actions">
              <button class="btn btn-sm btn-secondary plot-edit-btn" data-plot-id="${pl.id}">編集</button>
              <button class="btn btn-sm btn-danger plot-delete-btn" data-plot-id="${pl.id}">削除</button>
            </div>
          </div>
        `;
      })
      .join("");

    // Checkbox events
    plotList.querySelectorAll(".plot-checkbox").forEach((cb) => {
      cb.addEventListener("click", () => {
        togglePlotComplete(cb.dataset.plotId);
      });
    });

    // Edit events
    plotList.querySelectorAll(".plot-edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openEditPlot(btn.dataset.plotId);
      });
    });

    // Delete events
    plotList.querySelectorAll(".plot-delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        deletePlotItem(btn.dataset.plotId);
      });
    });

    // Drag and drop for reordering
    setupDragAndDrop();
  }

  // ---- Drag and Drop ----
  let draggedEl = null;

  function setupDragAndDrop() {
    const items = plotList.querySelectorAll(".plot-item");
    items.forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        draggedEl = item;
        item.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        items.forEach((i) => i.classList.remove("drag-over"));
        draggedEl = null;
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedEl && draggedEl !== item) {
          item.classList.add("drag-over");
        }
      });

      item.addEventListener("dragleave", () => {
        item.classList.remove("drag-over");
      });

      item.addEventListener("drop", (e) => {
        e.preventDefault();
        item.classList.remove("drag-over");
        if (!draggedEl || draggedEl === item) return;

        const p = getProject(currentProjectId);
        if (!p) return;

        const fromId = draggedEl.dataset.plotId;
        const toId = item.dataset.plotId;
        const fromIdx = p.plots.findIndex((pl) => pl.id === fromId);
        const toIdx = p.plots.findIndex((pl) => pl.id === toId);

        if (fromIdx === -1 || toIdx === -1) return;

        const [moved] = p.plots.splice(fromIdx, 1);
        p.plots.splice(toIdx, 0, moved);

        // Update order values
        p.plots.forEach((pl, i) => {
          pl.order = i;
        });

        p.updatedAt = new Date().toISOString();
        persist();
        renderPlotList(p);
        renderPlotProgress(p);
      });
    });
  }

  // ---- Actions: Project CRUD ----
  function openNewProjectModal() {
    editingProjectId = null;
    modalTitle.textContent = "新規プロジェクト";
    projectForm.reset();
    // Default to 'both'
    document.querySelector('input[name="progressMode"][value="both"]').checked = true;
    projectModal.style.display = "";
  }

  function openEditProjectModal(id) {
    const p = getProject(id);
    if (!p) return;
    editingProjectId = id;
    modalTitle.textContent = "プロジェクトを編集";
    $("#projectTitle").value = p.title;
    $("#projectDescription").value = p.description || "";
    $("#projectDeadline").value = p.deadline || "";
    $("#projectTargetWordCount").value = p.targetWordCount || "";
    const radio = document.querySelector(`input[name="progressMode"][value="${p.progressMode}"]`);
    if (radio) radio.checked = true;
    projectModal.style.display = "";
  }

  function closeProjectModal() {
    projectModal.style.display = "none";
    editingProjectId = null;
  }

  function saveProject(e) {
    e.preventDefault();

    const title = $("#projectTitle").value.trim();
    const description = $("#projectDescription").value.trim();
    const deadline = $("#projectDeadline").value || null;
    const targetWordCountRaw = $("#projectTargetWordCount").value;
    const targetWordCount = targetWordCountRaw ? parseInt(targetWordCountRaw, 10) : null;
    const progressMode = document.querySelector('input[name="progressMode"]:checked').value;

    if (!title) return;

    if (editingProjectId) {
      // Edit existing
      const p = getProject(editingProjectId);
      if (!p) return;
      p.title = title;
      p.description = description;
      p.deadline = deadline;
      p.targetWordCount = targetWordCount;
      p.progressMode = progressMode;
      p.updatedAt = new Date().toISOString();
    } else {
      // New project
      const newProject = {
        id: generateId(),
        title,
        description,
        deadline,
        targetWordCount,
        currentWordCount: 0,
        progressMode,
        plots: [],
        wordCountHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      projects.push(newProject);
    }

    persist();
    closeProjectModal();

    if (currentProjectId) {
      renderProjectDetail();
    } else {
      renderProjectList();
    }
  }

  function deleteProject() {
    showConfirm("このプロジェクトを削除しますか？この操作は取り消せません。", () => {
      projects = projects.filter((p) => p.id !== currentProjectId);
      persist();
      closeProjectDetail();
    });
  }

  // ---- Actions: Word Count ----
  function updateWordCount() {
    const p = getProject(currentProjectId);
    if (!p) return;

    const val = parseInt(currentWordCountInput.value, 10);
    if (isNaN(val) || val < 0) return;

    p.currentWordCount = val;

    // Add to history (merge if same day)
    const today = todayISO();
    const existing = p.wordCountHistory.find((h) => h.date === today);
    if (existing) {
      existing.count = val;
    } else {
      p.wordCountHistory.push({ date: today, count: val });
    }

    p.updatedAt = new Date().toISOString();
    persist();
    renderWordCountProgress(p);
    renderWordCountHistory(p);
  }

  // ---- Actions: Plot Items ----
  function openAddPlotModal() {
    editingPlotId = null;
    plotModalTitle.textContent = "プロット項目を追加";
    plotForm.reset();
    plotModal.style.display = "";
  }

  function openEditPlot(plotId) {
    const p = getProject(currentProjectId);
    if (!p) return;
    const plot = p.plots.find((pl) => pl.id === plotId);
    if (!plot) return;

    editingPlotId = plotId;
    plotModalTitle.textContent = "プロット項目を編集";
    $("#plotTitle").value = plot.title;
    $("#plotDescription").value = plot.description || "";
    plotModal.style.display = "";
  }

  function closePlotModal() {
    plotModal.style.display = "none";
    editingPlotId = null;
  }

  function savePlotItem(e) {
    e.preventDefault();

    const p = getProject(currentProjectId);
    if (!p) return;

    const title = $("#plotTitle").value.trim();
    const description = $("#plotDescription").value.trim();

    if (!title) return;

    if (editingPlotId) {
      const plot = p.plots.find((pl) => pl.id === editingPlotId);
      if (!plot) return;
      plot.title = title;
      plot.description = description;
    } else {
      const maxOrder = p.plots.length > 0 ? Math.max(...p.plots.map((pl) => pl.order)) : -1;
      p.plots.push({
        id: generateId(),
        title,
        description,
        order: maxOrder + 1,
        completed: false,
      });
    }

    p.updatedAt = new Date().toISOString();
    persist();
    closePlotModal();
    renderPlotProgress(p);
    renderPlotList(p);
  }

  function togglePlotComplete(plotId) {
    const p = getProject(currentProjectId);
    if (!p) return;
    const plot = p.plots.find((pl) => pl.id === plotId);
    if (!plot) return;

    plot.completed = !plot.completed;
    p.updatedAt = new Date().toISOString();
    persist();
    renderPlotProgress(p);
    renderPlotList(p);
  }

  function deletePlotItem(plotId) {
    showConfirm("このプロット項目を削除しますか？", () => {
      const p = getProject(currentProjectId);
      if (!p) return;
      p.plots = p.plots.filter((pl) => pl.id !== plotId);
      p.plots.forEach((pl, i) => { pl.order = i; });
      p.updatedAt = new Date().toISOString();
      persist();
      renderPlotProgress(p);
      renderPlotList(p);
    });
  }

  // ---- Confirm Dialog ----
  function showConfirm(message, onOk) {
    confirmMessage.textContent = message;
    confirmCallback = onOk;
    confirmModal.style.display = "";
  }

  function closeConfirm() {
    confirmModal.style.display = "none";
    confirmCallback = null;
  }

  // ---- Event Bindings ----
  headerTitle.addEventListener("click", () => {
    if (currentProjectId) closeProjectDetail();
  });

  newProjectBtn.addEventListener("click", openNewProjectModal);
  backBtn.addEventListener("click", closeProjectDetail);
  editProjectBtn.addEventListener("click", () => openEditProjectModal(currentProjectId));
  deleteProjectBtn.addEventListener("click", deleteProject);

  modalCloseBtn.addEventListener("click", closeProjectModal);
  cancelFormBtn.addEventListener("click", closeProjectModal);
  projectForm.addEventListener("submit", saveProject);

  updateWordCountBtn.addEventListener("click", updateWordCount);

  addPlotBtn.addEventListener("click", openAddPlotModal);
  plotModalCloseBtn.addEventListener("click", closePlotModal);
  cancelPlotBtn.addEventListener("click", closePlotModal);
  plotForm.addEventListener("submit", savePlotItem);

  confirmCancelBtn.addEventListener("click", closeConfirm);
  confirmOkBtn.addEventListener("click", () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
  });

  // Close modals on overlay click
  [projectModal, plotModal, confirmModal].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
        editingProjectId = null;
        editingPlotId = null;
        confirmCallback = null;
      }
    });
  });

  // Keyboard: Escape to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (confirmModal.style.display !== "none") {
        closeConfirm();
      } else if (plotModal.style.display !== "none") {
        closePlotModal();
      } else if (projectModal.style.display !== "none") {
        closeProjectModal();
      }
    }
  });

  // ---- Init ----
  renderProjectList();
})();
