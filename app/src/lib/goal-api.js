export function computeUomScore(uomType, actual, target, deadlineDate, achievedAt = new Date()) {
  const actualValue = Number(actual);
  const targetValue = Number(target);

  if (uomType === "MIN") {
    if (!targetValue) return 0;
    return Math.min(100, (actualValue / targetValue) * 100);
  }

  if (uomType === "MAX") {
    if (!actualValue) return 100;
    if (!targetValue) return 0;
    return Math.min(100, (targetValue / actualValue) * 100);
  }

  if (uomType === "TIMELINE") {
    if (!deadlineDate) return 0;
    return new Date(achievedAt) <= new Date(deadlineDate) ? 100 : 0;
  }

  if (uomType === "ZERO") {
    return actualValue === 0 ? 100 : 0;
  }

  return 0;
}

export function goalAuditActionFromStatus(status) {
  if (status === "APPROVED") return "goal.approved";
  if (status === "RETURNED") return "goal.returned";
  if (status === "DRAFT") return "goal.unlocked";
  return "goal.updated";
}

export function parsePositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
