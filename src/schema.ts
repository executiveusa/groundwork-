import { z } from "zod/v4"

// ---- Scoring model -------------------------------------------------------------------------------
// Category weights come from the Nonprofit Collins gauntlet. The source document lists weights that add up to
// 104 although it says 100, so the scoring engine normalizes them (see scoring.ts and docs/ARCHITECTURE.md).
export const CATEGORY_IDS = [
  "mission",
  "theory_of_change",
  "programs",
  "evidence_impact",
  "credibility",
  "funder_readiness",
  "transparency_governance",
  "legal_disclosure",
  "privacy_data",
  "safeguarding",
  "visual_design",
  "ux_ia",
  "mobile",
  "accessibility",
  "technical",
  "performance",
  "search_footprint",
  "partner_readiness",
  "conversion",
  "ops_maintainability",
] as const
export type CategoryId = (typeof CATEGORY_IDS)[number]
export const categoryId = z.enum(CATEGORY_IDS)

// ---- Organization profile (intake) ---------------------------------------------------------------
export const PROFILE_TAGS = [
  "youth_serving",
  "vulnerable_population",
  "takes_donations",
  "collects_forms",
  "has_events",
  "bilingual",
  "targets_federal_grants",
  "has_staff",
  "new_org",
  "fiscally_sponsored",
  "social_enterprise",
  "volunteers",
  "international_work",
  "uses_sms_or_email_marketing",
] as const
export const profileTag = z.enum(PROFILE_TAGS)
export type ProfileTag = z.infer<typeof profileTag>

export const profileSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  legalName: z.string().optional(),
  url: z.string().url(),
  ein: z.string().regex(/^\d{2}-?\d{7}$/).optional(),
  state: z.string().length(2).optional(),
  country: z.string().default("US"),
  orgType: z.enum(["nonprofit", "fiscally_sponsored", "social_enterprise", "other"]).default("nonprofit"),
  stage: z.enum(["concept", "early", "operating", "established"]).default("early"),
  tags: z.array(profileTag).default([]),
  leaders: z.array(z.string()).default([]),
  socialHandles: z.record(z.string(), z.string()).default({}),
  targetFunders: z.array(z.string()).default([]),
  notes: z.string().default(""),
  consentToAudit: z.boolean().default(false),
})
export type Profile = z.infer<typeof profileSchema>

// ---- Evidence and findings ------------------------------------------------------------------------
export const CLASSIFICATIONS = [
  "VERIFIED_FACT",
  "STRONG_EVIDENCE",
  "INFERENCE",
  "UNVERIFIED_CLAIM",
  "MISSING_INFORMATION",
  "POTENTIAL_RISK",
  "NEEDS_HUMAN_REVIEW",
] as const
export const classification = z.enum(CLASSIFICATIONS)
export type Classification = z.infer<typeof classification>

export const severity = z.enum(["P0", "P1", "P2", "P3"])
export type Severity = z.infer<typeof severity>
export const effort = z.enum(["XS", "S", "M", "L", "XL"])
export const impactArea = z.enum([
  "FUNDING",
  "TRUST",
  "CONVERSION",
  "SAFETY",
  "ACCESSIBILITY",
  "SEARCH",
  "PERFORMANCE",
  "OPERATIONS",
  "BRAND",
])
export const ownerType = z.enum(["organization", "our_team", "lawyer_or_accountant", "board", "funder_or_sponsor"])

export const evidenceSchema = z.object({
  id: z.string(),
  source: z.enum(["crawl", "technical", "record", "search", "manual", "browser"]),
  url: z.string().optional(),
  observation: z.string(),
  classification: classification,
  retrievedAt: z.string(),
})
export type Evidence = z.infer<typeof evidenceSchema>

export const findingSchema = z.object({
  id: z.string(),
  checklistId: z.string().optional(),
  category: categoryId,
  title: z.string(),
  severity: severity,
  classification: classification,
  evidenceIds: z.array(z.string()).default([]),
  whatWeSaw: z.string(),
  whyItMatters: z.string(),
  recommendedChange: z.string(),
  proofOfCompletion: z.string(),
  effort: effort,
  impact: z.array(impactArea).default([]),
  ownerType: ownerType.default("organization"),
  needsHumanReview: z.boolean().default(false),
})
export type Finding = z.infer<typeof findingSchema>

export const gradeSchema = z.object({
  // null = not applicable to this organization (excluded from the weighted total).
  grade: z.number().min(0).max(10).nullable(),
  rationale: z.string(),
})

export const findingsFileSchema = z.object({
  slug: z.string(),
  generatedAt: z.string(),
  grades: z.record(categoryId, gradeSchema),
  findings: z.array(findingSchema),
  whatAFunderSees: z.string(),
  strengthsToLock: z.array(z.string()).default([]),
  questionsForOrganization: z.array(z.string()).default([]),
  identityDiscrepancies: z
    .array(z.object({ field: z.string(), websiteSays: z.string(), recordSays: z.string(), status: z.string() }))
    .default([]),
  reviewerNotes: z.string().default(""),
})
export type FindingsFile = z.infer<typeof findingsFileSchema>

// ---- Knowledge base -------------------------------------------------------------------------------
export const checklistItemSchema = z.object({
  id: z.string(),
  category: categoryId,
  title: z.string(),
  check: z.string(),
  method: z.array(z.enum(["crawl", "technical", "record", "search", "browser", "manual", "legal_review"])).min(1),
  why: z.string(),
  severity: severity,
  effort: effort,
  impact: z.array(impactArea).default([]),
  // Item applies when ALL tags in `all` are present and at least one tag in `any` is present (when given).
  appliesWhen: z.object({ all: z.array(profileTag).default([]), any: z.array(profileTag).default([]) }).default({ all: [], any: [] }),
  fix: z.string(),
  nwkPrecedent: z.string().optional(),
  sourceUrl: z.string().optional(),
})
export type ChecklistItem = z.infer<typeof checklistItemSchema>
export const checklistFileSchema = z.object({ version: z.string(), items: z.array(checklistItemSchema) })

export const presenceEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  url: z.string(),
  what_it_proves_or_gives: z.string().optional(),
  who_it_applies_to: z.union([z.string(), z.array(z.string())]).optional(),
  cost: z.string().optional(),
  effort: z.string().optional(),
  common_mistake: z.string().optional(),
  how_to_verify_presence: z.string().optional(),
  notes: z.string().optional(),
})
export const presenceFileSchema = z.object({ checked_on: z.string().optional(), entries: z.array(presenceEntrySchema) })
