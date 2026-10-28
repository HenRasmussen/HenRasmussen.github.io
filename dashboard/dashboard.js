const formatDate = (value) => new Intl.DateTimeFormat('da-DK', {
  dateStyle: 'long',
  timeZone: 'Europe/Copenhagen'
}).format(new Date(value));

const sumStatus = (projects, status) => projects.reduce(
  (sum, project) => sum + (project.status[status] || 0), 0
);

const createStatus = (label, value, total, className) => {
  const percent = total ? (value / total) * 100 : 0;
  return `<div class="status-row">
    <span><i class="status-dot ${className}"></i>${label}</span>
    <strong>${value}</strong>
    <div class="status-track" aria-hidden="true"><i class="${className}" style="width:${percent}%"></i></div>
  </div>`;
};

const createProjectCard = (project) => {
  const total = Object.values(project.status).reduce((sum, value) => sum + value, 0);
  const open = project.status.Backlog + project.status['In progress'];
  const donePercent = total ? Math.round((project.status.Done / total) * 100) : 0;
  const title = project.displayName || project.name;
  const emptyText = total === 0 ? '<p class="empty-board">Ingen backlogelementer</p>' : '';
  const attention = project.attention
    ? `<p class="attention"><span aria-hidden="true">!</span>${project.attentionText}</p>`
    : '';

  return `<article class="dashboard-card" data-reveal>
    <div class="card-heading">
      <div>
        <span class="project-id">Project #${project.projectNumber}</span>
        <h3>${title}</h3>
      </div>
      <div class="completion" style="--progress:${donePercent * 3.6}deg" aria-label="${donePercent} procent Done">
        <strong>${donePercent}%</strong><span>Done</span>
      </div>
    </div>
    <div class="open-count"><strong>${open}</strong><span>åbne elementer</span></div>
    <div class="card-status">
      ${createStatus('Backlog', project.status.Backlog, total, 'backlog')}
      ${createStatus('In progress', project.status['In progress'], total, 'progress')}
      ${createStatus('Done', project.status.Done, total, 'done')}
    </div>
    ${emptyText}${attention}
    <div class="card-footer">
      <span>${project.blockers} blockers</span>
      <a href="${project.url}" target="_blank" rel="noreferrer">Åbn GitHub Project <span aria-hidden="true">↗</span></a>
    </div>
  </article>`;
};

const render = (data) => {
  const projects = data.projects;
  const backlog = sumStatus(projects, 'Backlog');
  const inProgress = sumStatus(projects, 'In progress');
  const done = sumStatus(projects, 'Done');
  const total = backlog + inProgress + done;
  const blockers = projects.reduce((sum, project) => sum + project.blockers, 0);

  document.querySelector('#generated-at').textContent = formatDate(data.generatedAt);
  document.querySelector('#total-projects').textContent = projects.length;
  document.querySelector('#total-open').textContent = backlog + inProgress;
  document.querySelector('#total-items').textContent = total;
  document.querySelector('#total-blockers').textContent = blockers;

  const segments = [
    ['Backlog', backlog, 'backlog'],
    ['In progress', inProgress, 'progress'],
    ['Done', done, 'done']
  ];
  document.querySelector('#distribution-chart').innerHTML = `
    <div class="stacked-bar" aria-label="Backlog ${backlog}, In progress ${inProgress}, Done ${done}">
      ${segments.map(([label, value, className]) => `<i class="${className}" style="width:${total ? value / total * 100 : 0}%" title="${label}: ${value}"></i>`).join('')}
    </div>
    <div class="legend">${segments.map(([label, value, className]) => `<span><i class="status-dot ${className}"></i>${label} <strong>${value}</strong></span>`).join('')}</div>`;
  document.querySelector('#project-grid').innerHTML = projects.map(createProjectCard).join('');
  document.querySelectorAll('#project-grid [data-reveal]').forEach((item) => item.classList.add('is-visible'));
};

fetch('data.json', { cache: 'no-store' })
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(render)
  .catch(() => {
    document.querySelector('#load-error').hidden = false;
  });
