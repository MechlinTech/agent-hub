/** Maps rule pack names (partial match) to allowed rule IDs. null = all rules. */
export const ALL_RULE_IDS = [
  "JMX-001", "JMX-002", "JMX-003", "JMX-004", "JMX-005", "JMX-006", "JMX-007",
  "JMX-008", "JMX-009", "JMX-010", "JMX-011", "JMX-012", "JMX-013", "JMX-014",
  "JMX-015", "JMX-016", "JMX-017", "JMX-018", "JMX-019", "JMX-020",
];

export function getRuleIdsForPack(packName: string): string[] {
  const name = packName.toLowerCase();
  if (name.includes("api")) {
    return ALL_RULE_IDS.filter((id) => id !== "JMX-014");
  }
  if (name.includes("web")) {
    return ALL_RULE_IDS;
  }
  if (name.includes("blazemeter") || name.includes("enterprise")) {
    return ["JMX-006", "JMX-007", "JMX-008", "JMX-009", "JMX-010", "JMX-011",
      "JMX-013", "JMX-016", "JMX-017", "JMX-019", "JMX-020", "JMX-003", "JMX-004", "JMX-005"];
  }
  if (name.includes("default")) {
    return ALL_RULE_IDS.filter((id) => !["JMX-018"].includes(id));
  }
  return ALL_RULE_IDS;
}

export function isRuleInPack(ruleId: string, packName: string): boolean {
  return getRuleIdsForPack(packName).includes(ruleId);
}
