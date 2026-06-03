import { XMLParser } from "fast-xml-parser";
import type { JmxInventory } from "@/lib/types";

const GENERIC_NAMES = ["test plan", "thread group", "untitled", "new test plan"];

function collectByTag(obj: unknown, tag: string, results: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (!obj || typeof obj !== "object") return results;
  if (Array.isArray(obj)) {
    obj.forEach((item) => collectByTag(item, tag, results));
    return results;
  }
  const record = obj as Record<string, unknown>;
  if (record[tag]) {
    const nodes = Array.isArray(record[tag]) ? record[tag] : [record[tag]];
    nodes.forEach((n) => results.push(n as Record<string, unknown>));
  }
  Object.values(record).forEach((v) => collectByTag(v, tag, results));
  return results;
}

function getProp(nodes: Record<string, unknown>[], name: string): string | undefined {
  for (const node of nodes) {
    const props = node.stringProp ?? node.boolProp ?? node.intProp;
    const list = props ? (Array.isArray(props) ? props : [props]) : [];
    for (const p of list) {
      const prop = p as Record<string, unknown>;
      if (prop["@_name"] === name) {
        return String(prop["#text"] ?? prop["@_value"] ?? "");
      }
    }
  }
  return undefined;
}

function isDisabled(node: Record<string, unknown>): boolean {
  return node["@_enabled"] === "false" || node["@_enabled"] === false;
}

function walkStrings(obj: unknown, matches: string[] = [], patterns: RegExp[]): string[] {
  if (!obj) return matches;
  if (typeof obj === "string") {
    patterns.forEach((p) => {
      if (p.test(obj)) matches.push(obj);
    });
    return matches;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v) => walkStrings(v, matches, patterns));
    return matches;
  }
  if (typeof obj === "object") {
    Object.values(obj).forEach((v) => walkStrings(v, matches, patterns));
  }
  return matches;
}

export function parseJmx(xmlContent: string, fileName: string): JmxInventory {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    isArray: (name) =>
      [
        "elementProp",
        "stringProp",
        "boolProp",
        "intProp",
        "collectionProp",
        "HTTPSamplerProxy",
        "ThreadGroup",
        "ResultCollector",
        "ResponseAssertion",
        "JSONPathAssertion",
        "DurationAssertion",
        "RegexExtractor",
        "JSONPostProcessor",
        "BoundaryExtractor",
        "ConstantTimer",
        "UniformRandomTimer",
        "GaussianRandomTimer",
        "CSVDataSet",
        "HeaderManager",
        "CookieManager",
        "TransactionController",
        "hashTree",
      ].includes(name),
  });

  const doc = parser.parse(xmlContent);
  const jmeter = doc.jmeterTestPlan ?? doc;
  const hashTree = jmeter.hashTree ?? jmeter;

  const threadGroups = collectByTag(hashTree, "ThreadGroup");
  const samplers = collectByTag(hashTree, "HTTPSamplerProxy");
  const assertions = [
    ...collectByTag(hashTree, "ResponseAssertion"),
    ...collectByTag(hashTree, "JSONPathAssertion"),
    ...collectByTag(hashTree, "DurationAssertion"),
  ];
  const timers = [
    ...collectByTag(hashTree, "ConstantTimer"),
    ...collectByTag(hashTree, "UniformRandomTimer"),
    ...collectByTag(hashTree, "GaussianRandomTimer"),
  ];
  const csvDataSets = collectByTag(hashTree, "CSVDataSet");
  const extractors = [
    ...collectByTag(hashTree, "RegexExtractor"),
    ...collectByTag(hashTree, "JSONPostProcessor"),
    ...collectByTag(hashTree, "BoundaryExtractor"),
  ];
  const listeners = collectByTag(hashTree, "ResultCollector");
  const headerManagers = collectByTag(hashTree, "HeaderManager");
  const cookieManagers = collectByTag(hashTree, "CookieManager");
  const transactionControllers = collectByTag(hashTree, "TransactionController");

  const allNodes = collectByTag(hashTree, "hashTree").concat(
    threadGroups,
    samplers,
    assertions,
    timers,
    listeners
  );
  const disabledElements = allNodes.filter(isDisabled).length + samplers.filter(isDisabled).length;

  const testPlanNodes = collectByTag(hashTree, "TestPlan");
  const testPlanName =
    getProp(testPlanNodes, "TestPlan.comments") ||
    getProp(testPlanNodes, "TestPlan.functional_mode") ||
    fileName.replace(/\.jmx$/i, "");

  const threadGroupNames = threadGroups.map((tg) => getProp([tg], "TestPlan.comments") || tg["@_testname"] || "Thread Group").filter(Boolean) as string[];
  const samplerNames = samplers
    .filter((s) => !isDisabled(s))
    .map((s) => String(s["@_testname"] ?? "HTTP Request"));

  const viewResultsTree = listeners.some((l) => {
    const name = String(l["@_testname"] ?? "").toLowerCase();
    return name.includes("view results tree") || name.includes("view results in table");
  });

  const localPaths = walkStrings(doc, [], [/^[A-Za-z]:\\/, /^\/Users\//, /^\/home\//]);
  const bearerMatches = walkStrings(doc, [], [/Bearer\s+eyJ[a-zA-Z0-9_-]+/i, /Authorization.*Bearer\s+[A-Za-z0-9._-]{20,}/i]);
  const passwordMatches = walkStrings(doc, [], [/password\s*=\s*["']?[^"'\s${}]+/i, /client_secret/i]);
  const hardcodedUrls = walkStrings(doc, [], [/"https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/i]).filter((s) => !s.includes("${"));

  const samplersWithoutAssertion: string[] = [];
  if (assertions.length === 0) {
    samplersWithoutAssertion.push(...samplerNames.slice(0, 8));
  } else if (samplers.length > assertions.length) {
    const diff = Math.max(0, samplers.length - assertions.length);
    samplersWithoutAssertion.push(...samplerNames.slice(0, Math.min(diff, 8)));
  }

  const genericTestPlanName = GENERIC_NAMES.some((g) => testPlanName.toLowerCase().includes(g));
  const genericThreadGroupNames = threadGroupNames.some((n) => GENERIC_NAMES.includes(String(n).toLowerCase()));

  return {
    testPlanName,
    threadGroups: threadGroups.length,
    httpSamplers: samplers.filter((s) => !isDisabled(s)).length,
    transactionControllers: transactionControllers.length,
    assertions: assertions.length,
    timers: timers.length,
    csvDataSets: csvDataSets.length,
    extractors: extractors.length,
    listeners: listeners.length,
    headerManagers: headerManagers.length,
    cookieManagers: cookieManagers.length,
    configElements: headerManagers.length + cookieManagers.length + csvDataSets.length,
    disabledElements,
    variables: walkStrings(doc, [], [/\$\{[a-zA-Z_][a-zA-Z0-9_]*\}/]).length,
    details: {
      threadGroupNames: threadGroupNames as string[],
      samplerNames,
      hasViewResultsTree: viewResultsTree,
      hasLocalPaths: localPaths.length > 0,
      hasHardcodedBearer: bearerMatches.length > 0,
      hasHardcodedPassword: passwordMatches.length > 0,
      hasHardcodedBaseUrl: hardcodedUrls.length > 0,
      samplersWithoutAssertion,
      genericThreadGroupNames,
      genericTestPlanName,
      noTransactionControllers: transactionControllers.length === 0,
      noCookieManager: cookieManagers.length === 0,
      noHeaderManager: headerManagers.length === 0,
      noTimers: timers.length === 0,
      noAssertions: assertions.length === 0,
      noCsvDataSet: csvDataSets.length === 0,
      disabledCount: disabledElements,
      localPathExamples: localPaths.slice(0, 3),
      bearerTokenSnippet: bearerMatches[0]?.slice(0, 120),
      passwordSnippet: passwordMatches[0]?.slice(0, 80),
    },
  };
}
