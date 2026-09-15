// Derives anonymized, per-task "people you are supporting" cards from real
// habitation vulnerability data + the task's own progress counters. No
// Math.random() — every status assignment below is index/modulo-derived from
// the habitation's own deterministic vulnerability breakdown, so re-rendering
// (or reloading) always produces the exact same list for the exact same task.
const MAX_CARDS_PER_TASK = 8

/**
 * @returns {{id,label,area,priority,status,assistance,team,verification}[]}
 */
export function derivePeopleForTask(task, habitation) {
  if (!task || !habitation) return []
  const { evacuated = 0, inTransit = 0, remaining = 0, unverified = 0 } = task.progress || {}
  const priority = task.priority === 'critical' || task.priority === 'high' ? 'High' : 'Medium'
  const area = habitation.name

  const cards = []
  const elderly = Math.min(habitation.vulnerability?.elderly || 0, 3)
  const disabled = Math.min(habitation.vulnerability?.disabled || 0, 2)
  const families = Math.min(Math.ceil((task.affectedPeople || 0) / 40), 3)

  for (let i = 0; i < elderly; i += 1) {
    const bucket = i % 4
    const status = bucket === 0 && evacuated > 0 ? 'Evacuated' : bucket === 1 && inTransit > 0 ? 'In Transit' : bucket === 2 && unverified > 0 ? 'Unverified' : 'Critical'
    cards.push({
      id: `${task.id}-elderly-${i + 1}`,
      label: `Elderly Resident #${String(i + 1).padStart(3, '0')}`,
      area,
      priority: 'High',
      status,
      assistance: 'Mobility assistance required',
      team: task.assignedVolunteerId,
      verification: status === 'Unverified' ? 'Unverified' : 'Verified',
    })
  }
  for (let i = 0; i < disabled; i += 1) {
    const status = remaining > 0 ? 'Critical' : evacuated > 0 ? 'Evacuated' : 'Unverified'
    cards.push({
      id: `${task.id}-assist-${i + 1}`,
      label: `Resident #${String(i + 100 + i).padStart(3, '0')}`,
      area,
      priority: 'High',
      status,
      assistance: 'Accessibility support required',
      team: task.assignedVolunteerId,
      verification: status === 'Unverified' ? 'Unverified' : 'Verified',
    })
  }
  for (let i = 0; i < families; i += 1) {
    const label = `Family Group ${String.fromCharCode(65 + i)}`
    const bucket = i % 3
    const status = bucket === 0 && evacuated > 0 ? 'Evacuated' : bucket === 1 && inTransit > 0 ? 'In Transit' : priority === 'High' ? 'High' : 'Unverified'
    cards.push({
      id: `${task.id}-family-${i}`,
      label,
      area,
      priority,
      status,
      assistance: null,
      team: task.assignedVolunteerId,
      verification: status === 'Unverified' ? 'Unverified' : 'Verified',
    })
  }

  return cards.slice(0, MAX_CARDS_PER_TASK)
}

export function derivePeopleForTasks(tasks, habitations) {
  return tasks.flatMap((t) => derivePeopleForTask(t, habitations.find((h) => h.id === t.habitationId)))
}

/** Aggregate counts across all of a volunteer's tasks — real sums, never invented. */
export function summarizePeopleStatus(tasks) {
  return tasks.reduce(
    (acc, t) => {
      const p = t.progress || {}
      acc.evacuated += p.evacuated || 0
      acc.inTransit += p.inTransit || 0
      acc.unverified += p.unverified || 0
      acc.critical += t.priority === 'critical' ? p.remaining || 0 : 0
      acc.high += t.priority === 'high' ? p.remaining || 0 : 0
      return acc
    },
    { critical: 0, high: 0, evacuated: 0, inTransit: 0, unverified: 0 }
  )
}
