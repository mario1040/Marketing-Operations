import { DatabaseSchema } from '../server/storage';
import { IntegrityDiagnosticReport, IntegrityIssue } from '../types';

export function checkDataIntegrity(db: DatabaseSchema): IntegrityDiagnosticReport {
  const issues: IntegrityIssue[] = [];
  const workspaces = db.workspaces || [];
  const brands = db.brands || [];
  const campaigns = db.campaigns || [];
  const content = db.content || [];
  const team = db.team || [];
  const activities = db.activities || [];

  const wsMap = new Map<string, any>();
  const brandMap = new Map<string, any>();
  const campaignMap = new Map<string, any>();
  const contentMap = new Map<string, any>();

  // Check 1: Duplicate Workspace IDs
  for (const ws of workspaces) {
    if (!ws.id) {
      issues.push({
        severity: 'error',
        entityType: 'workspace',
        entityId: 'unknown',
        message: 'Workspace missing required ID',
      });
      continue;
    }
    if (wsMap.has(ws.id)) {
      issues.push({
        severity: 'error',
        entityType: 'workspace',
        entityId: ws.id,
        message: `Duplicate workspace ID detected: "${ws.id}"`,
      });
    }
    wsMap.set(ws.id, ws);
  }

  // Check 2: Brands
  for (const b of brands) {
    if (!b.id) {
      issues.push({
        severity: 'error',
        entityType: 'brand',
        entityId: 'unknown',
        message: 'Brand missing required ID',
      });
      continue;
    }
    if (brandMap.has(b.id)) {
      issues.push({
        severity: 'error',
        entityType: 'brand',
        entityId: b.id,
        message: `Duplicate brand ID detected: "${b.id}"`,
      });
    }
    brandMap.set(b.id, b);

    if (!b.workspaceId) {
      issues.push({
        severity: 'error',
        entityType: 'brand',
        entityId: b.id,
        message: `Brand "${b.name}" (${b.id}) has no workspaceId`,
        suggestedFix: 'Assign to default workspace',
      });
    } else if (!wsMap.has(b.workspaceId)) {
      issues.push({
        severity: 'error',
        entityType: 'brand',
        entityId: b.id,
        message: `Brand "${b.name}" (${b.id}) references nonexistent workspaceId "${b.workspaceId}"`,
      });
    }
  }

  // Check 3: Campaigns
  for (const c of campaigns) {
    if (!c.id) {
      issues.push({
        severity: 'error',
        entityType: 'campaign',
        entityId: 'unknown',
        message: 'Campaign missing required ID',
      });
      continue;
    }
    if (campaignMap.has(c.id)) {
      issues.push({
        severity: 'error',
        entityType: 'campaign',
        entityId: c.id,
        message: `Duplicate campaign ID detected: "${c.id}"`,
      });
    }
    campaignMap.set(c.id, c);

    if (!c.workspaceId) {
      issues.push({
        severity: 'error',
        entityType: 'campaign',
        entityId: c.id,
        message: `Campaign "${c.name}" has no workspaceId`,
      });
    } else if (!wsMap.has(c.workspaceId)) {
      issues.push({
        severity: 'error',
        entityType: 'campaign',
        entityId: c.id,
        message: `Campaign "${c.name}" references nonexistent workspaceId "${c.workspaceId}"`,
      });
    }

    if (!c.brandId) {
      issues.push({
        severity: 'error',
        entityType: 'campaign',
        entityId: c.id,
        message: `Campaign "${c.name}" has no brandId`,
      });
    } else {
      const brand = brandMap.get(c.brandId);
      if (!brand) {
        issues.push({
          severity: 'error',
          entityType: 'campaign',
          entityId: c.id,
          message: `Campaign "${c.name}" references nonexistent brandId "${c.brandId}"`,
        });
      } else if (c.workspaceId && brand.workspaceId !== c.workspaceId) {
        issues.push({
          severity: 'error',
          entityType: 'campaign',
          entityId: c.id,
          message: `Campaign "${c.name}" in workspace "${c.workspaceId}" references brand "${brand.name}" belonging to another workspace "${brand.workspaceId}"`,
        });
      }
    }
  }

  // Check 4: Content Items
  for (const item of content) {
    if (!item.id) {
      issues.push({
        severity: 'error',
        entityType: 'content',
        entityId: 'unknown',
        message: 'Content item missing required ID',
      });
      continue;
    }
    if (contentMap.has(item.id)) {
      issues.push({
        severity: 'error',
        entityType: 'content',
        entityId: item.id,
        message: `Duplicate content ID detected: "${item.id}"`,
      });
    }
    contentMap.set(item.id, item);

    if (!item.workspaceId) {
      issues.push({
        severity: 'error',
        entityType: 'content',
        entityId: item.id,
        message: `Content item "${item.topic}" has no workspaceId`,
      });
    } else if (!wsMap.has(item.workspaceId)) {
      issues.push({
        severity: 'error',
        entityType: 'content',
        entityId: item.id,
        message: `Content item "${item.topic}" references nonexistent workspaceId "${item.workspaceId}"`,
      });
    }

    if (!item.brandId) {
      issues.push({
        severity: 'error',
        entityType: 'content',
        entityId: item.id,
        message: `Content item "${item.topic}" has no brandId`,
      });
    } else {
      const brand = brandMap.get(item.brandId);
      if (!brand) {
        issues.push({
          severity: 'error',
          entityType: 'content',
          entityId: item.id,
          message: `Content item "${item.topic}" references nonexistent brandId "${item.brandId}"`,
        });
      } else if (item.workspaceId && brand.workspaceId !== item.workspaceId) {
        issues.push({
          severity: 'error',
          entityType: 'content',
          entityId: item.id,
          message: `Content item "${item.topic}" belongs to workspace "${item.workspaceId}" but references brand "${brand.name}" belonging to workspace "${brand.workspaceId}"`,
        });
      }
    }

    // Check Campaign relationship
    if (item.campaignId) {
      const camp = campaignMap.get(item.campaignId);
      if (!camp) {
        issues.push({
          severity: 'warning',
          entityType: 'content',
          entityId: item.id,
          message: `Content item "${item.topic}" references nonexistent campaignId "${item.campaignId}"`,
          suggestedFix: 'Clear orphaned campaignId reference',
        });
      } else {
        if (item.workspaceId && camp.workspaceId !== item.workspaceId) {
          issues.push({
            severity: 'error',
            entityType: 'content',
            entityId: item.id,
            message: `Content item "${item.topic}" references campaign "${camp.name}" belonging to a different workspace`,
          });
        }
        if (item.brandId && camp.brandId && camp.brandId !== item.brandId) {
          issues.push({
            severity: 'warning',
            entityType: 'content',
            entityId: item.id,
            message: `Content item "${item.topic}" (Brand: ${item.brandId}) references campaign "${camp.name}" assigned to different brand (${camp.brandId})`,
            suggestedFix: 'Re-align brand or decouple campaign reference',
          });
        }
      }
    }
  }

  // Check 5: Team Members
  for (const m of team) {
    if (!m.id) {
      issues.push({
        severity: 'error',
        entityType: 'team',
        entityId: 'unknown',
        message: 'Team member missing required ID',
      });
      continue;
    }
    if (!m.workspaceId || !wsMap.has(m.workspaceId)) {
      issues.push({
        severity: 'error',
        entityType: 'team',
        entityId: m.id,
        message: `Team member "${m.name}" has invalid or missing workspaceId`,
      });
    }
    if (Array.isArray(m.brands)) {
      for (const bId of m.brands) {
        const brand = brandMap.get(bId);
        if (!brand) {
          issues.push({
            severity: 'warning',
            entityType: 'team',
            entityId: m.id,
            message: `Team member "${m.name}" assigned to nonexistent brandId "${bId}"`,
          });
        } else if (m.workspaceId && brand.workspaceId !== m.workspaceId) {
          issues.push({
            severity: 'error',
            entityType: 'team',
            entityId: m.id,
            message: `Team member "${m.name}" in workspace "${m.workspaceId}" assigned to brand "${brand.name}" in workspace "${brand.workspaceId}"`,
          });
        }
      }
    }
  }

  // Check 6: Activity Logs
  for (const a of activities) {
    if (!a.id) continue;
    if (a.workspaceId && !wsMap.has(a.workspaceId)) {
      issues.push({
        severity: 'warning',
        entityType: 'activity',
        entityId: a.id,
        message: `Activity log "${a.id}" references nonexistent workspaceId "${a.workspaceId}"`,
      });
    }
  }

  const healthy = issues.filter(i => i.severity === 'error').length === 0;
  const summary = healthy
    ? `Referential integrity verified: 0 critical errors across ${workspaces.length} workspaces, ${brands.length} brands, ${campaigns.length} campaigns, ${content.length} content items, ${team.length} team members.`
    : `Integrity check failed: ${issues.filter(i => i.severity === 'error').length} critical relational error(s) and ${issues.filter(i => i.severity === 'warning').length} warning(s) detected.`;

  return {
    timestamp: new Date().toISOString(),
    totalRecordsChecked: {
      workspaces: workspaces.length,
      brands: brands.length,
      campaigns: campaigns.length,
      content: content.length,
      team: team.length,
      activities: activities.length,
    },
    healthy,
    issues,
    summary,
  };
}
