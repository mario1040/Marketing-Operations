import test from 'node:test';
import assert from 'node:assert/strict';
import { StorageRepository } from './storage';
import { checkDataIntegrity } from '../utils/dataDiagnostics';
import { calculateOperationalKPIs } from '../utils/metrics';
import { Campaign, ContentItem } from '../types';

test('Referential Integrity Test Suite', async (t) => {
  const storage = new StorageRepository();

  await t.test('Scenario A — Full lifecycle in a new workspace', () => {
    // 1. Create workspace
    const ws = storage.createWorkspace({
      name: 'E2E Test Workspace',
      type: 'Agency',
      industry: 'Software Testing',
    });
    assert.ok(ws.id, 'Workspace must receive an ID');
    assert.equal(ws.name, 'E2E Test Workspace');

    // 2. Create brand in new workspace
    const brand = storage.createBrand({
      workspaceId: ws.id,
      name: 'CyberScale Test Brand',
      code: 'CBR',
      primaryColor: '#06B6D4',
    });
    assert.ok(brand.id, 'Brand must receive an ID');
    assert.equal(brand.workspaceId, ws.id);

    // 3. Create campaign for that brand
    const camp = storage.createCampaign({
      id: `cmp-test-${Date.now()}`,
      workspaceId: ws.id,
      brandId: brand.id,
      name: 'Q4 Product Launch',
      objective: 'Lead Generation',
      startDate: '2026-11-01',
      endDate: '2026-12-01',
      description: 'Test launch campaign',
      status: 'Active',
    });
    assert.ok(camp.id, 'Campaign created');
    assert.equal(camp.brandId, brand.id);
    assert.equal(camp.workspaceId, ws.id);

    // 4. Create content linked to brand and campaign
    const item = storage.createContent({
      id: `cnt-test-${Date.now()}`,
      workspaceId: ws.id,
      brandId: brand.id,
      campaignId: camp.id,
      topic: 'CyberScale Product Keynote Breakdown',
      contentDate: '2026-11-05',
      scheduledPublishingDate: '2026-11-05',
      platform: 'LinkedIn',
      contentType: 'Static Post',
      objective: 'Lead Generation',
      responsiblePerson: 'Lead Tester',
      status: 'Published',
      caption: 'Exciting announcement...',
      cta: 'Sign up now',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Lead Tester',
    });
    assert.equal(item.campaignId, camp.id);
    assert.equal(item.brandId, brand.id);

    // 5. Verify KPIs update correctly
    const scoped = storage.getScopedData(ws.id);
    assert.equal(scoped.brands.length, 1);
    assert.equal(scoped.campaigns.length, 1);
    assert.equal(scoped.content.length, 1);

    const kpis = calculateOperationalKPIs(scoped.content);
    assert.equal(kpis.total, 1);
    assert.equal(kpis.published, 1);
    assert.equal(kpis.executionRate, 100);
  });

  await t.test('Scenario B — Multi-brand isolation within same workspace', () => {
    const ws = storage.createWorkspace({
      name: 'Multi-Brand Holding Corp',
      type: 'Company',
    });

    const brandA = storage.createBrand({
      workspaceId: ws.id,
      name: 'Brand Alpha',
      code: 'ALPH',
    });

    const brandB = storage.createBrand({
      workspaceId: ws.id,
      name: 'Brand Beta',
      code: 'BETA',
    });

    const campA = storage.createCampaign({
      id: `cmp-a-${Date.now()}`,
      workspaceId: ws.id,
      brandId: brandA.id,
      name: 'Alpha Awareness Blitz',
      objective: 'Brand Awareness',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      description: 'Alpha campaign',
      status: 'Active',
    });

    const campB = storage.createCampaign({
      id: `cmp-b-${Date.now()}`,
      workspaceId: ws.id,
      brandId: brandB.id,
      name: 'Beta Demand Gen',
      objective: 'Lead Generation',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      description: 'Beta campaign',
      status: 'Active',
    });

    // Content for Alpha
    storage.createContent({
      id: `cnt-alph-${Date.now()}`,
      workspaceId: ws.id,
      brandId: brandA.id,
      campaignId: campA.id,
      topic: 'Alpha Insight Post',
      contentDate: '2026-11-03',
      scheduledPublishingDate: '2026-11-03',
      platform: 'LinkedIn',
      contentType: 'Static Post',
      objective: 'Brand Awareness',
      responsiblePerson: 'Alpha Lead',
      status: 'Published',
      caption: 'Alpha text',
      cta: 'Learn more',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Alpha Lead',
    });

    // Content for Beta
    storage.createContent({
      id: `cnt-beta-${Date.now()}`,
      workspaceId: ws.id,
      brandId: brandB.id,
      campaignId: campB.id,
      topic: 'Beta Case Study',
      contentDate: '2026-11-04',
      scheduledPublishingDate: '2026-11-04',
      platform: 'YouTube',
      contentType: 'Short Video',
      objective: 'Lead Generation',
      responsiblePerson: 'Beta Lead',
      status: 'Planned',
      caption: 'Beta text',
      cta: 'Book demo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Beta Lead',
    });

    // Filtering by Brand Alpha
    const alphaItems = storage.getContent(ws.id, { brandId: brandA.id });
    assert.equal(alphaItems.length, 1);
    assert.equal(alphaItems[0].brandId, brandA.id);
    assert.equal(alphaItems[0].topic, 'Alpha Insight Post');

    // Filtering by Brand Beta
    const betaItems = storage.getContent(ws.id, { brandId: brandB.id });
    assert.equal(betaItems.length, 1);
    assert.equal(betaItems[0].brandId, brandB.id);
    assert.equal(betaItems[0].topic, 'Beta Case Study');
  });

  await t.test('Scenario C — Strict rejection of invalid cross-workspace references', () => {
    const ws1 = storage.createWorkspace({ name: 'Workspace Alpha' });
    const ws2 = storage.createWorkspace({ name: 'Workspace Beta' });

    const brandWs1 = storage.createBrand({
      workspaceId: ws1.id,
      name: 'Brand in WS1',
      code: 'W1B',
    });

    // 1. Attempt to create campaign in WS2 with brand belonging to WS1
    assert.throws(
      () => {
        storage.createCampaign({
          id: `cmp-invalid-${Date.now()}`,
          workspaceId: ws2.id,
          brandId: brandWs1.id, // Invalid: belongs to WS1!
          name: 'Invalid Cross-Workspace Campaign',
          objective: 'Brand Awareness',
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          description: '',
          status: 'Active',
        });
      },
      /belongs to workspace/i,
      'Backend must reject campaign referencing brand from another workspace'
    );

    // 2. Attempt to create content in WS2 with brand belonging to WS1
    assert.throws(
      () => {
        storage.createContent({
          id: `cnt-invalid-${Date.now()}`,
          workspaceId: ws2.id,
          brandId: brandWs1.id, // Invalid!
          topic: 'Invalid cross-workspace content',
          contentDate: '2026-11-02',
          scheduledPublishingDate: '2026-11-02',
          platform: 'LinkedIn',
          contentType: 'Static Post',
          objective: 'Brand Awareness',
          responsiblePerson: 'Tester',
          status: 'Planned',
          caption: '',
          cta: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'Tester',
        });
      },
      /belongs to workspace/i,
      'Backend must reject content referencing brand from another workspace'
    );
  });

  await t.test('Scenario D — Editing campaign brand and persistence', () => {
    const ws = storage.createWorkspace({ name: 'Campaign Edit Workspace' });
    const brand1 = storage.createBrand({ workspaceId: ws.id, name: 'Brand 1', code: 'B1' });
    const brand2 = storage.createBrand({ workspaceId: ws.id, name: 'Brand 2', code: 'B2' });

    const camp = storage.createCampaign({
      id: `cmp-edit-${Date.now()}`,
      workspaceId: ws.id,
      brandId: brand1.id,
      name: 'Reassignable Campaign',
      objective: 'Brand Awareness',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      description: 'Initial brand 1 campaign',
      status: 'Active',
    });

    // Link a content item
    const content = storage.createContent({
      id: `cnt-linked-${Date.now()}`,
      workspaceId: ws.id,
      brandId: brand1.id,
      campaignId: camp.id,
      topic: 'Deliverable for campaign',
      contentDate: '2026-11-05',
      scheduledPublishingDate: '2026-11-05',
      platform: 'LinkedIn',
      contentType: 'Static Post',
      objective: 'Brand Awareness',
      responsiblePerson: 'Tester',
      status: 'Planned',
      caption: '',
      cta: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Tester',
    });

    // Update campaign to Brand 2
    const updated = storage.updateCampaign(camp.id, {
      brandId: brand2.id,
      name: 'Reassigned Campaign (Now Brand 2)',
    });

    assert.equal(updated.brandId, brand2.id);
    assert.equal(updated.name, 'Reassigned Campaign (Now Brand 2)');

    // Content deliverable must be re-aligned to Brand 2
    const reloadedContent = storage.getContent(ws.id).find(c => c.id === content.id);
    assert.ok(reloadedContent);
    assert.equal(reloadedContent.brandId, brand2.id, 'Linked content must re-align with updated campaign brand');

    // Integrity check must still be 100% healthy
    const audit = storage.runIntegrityAudit();
    assert.equal(audit.healthy, true, 'Audit must be healthy after campaign re-assignment');
  });

  await t.test('Scenario E — Campaign deletion safely decouples content deliverables', () => {
    const ws = storage.createWorkspace({ name: 'Campaign Delete Workspace' });
    const brand = storage.createBrand({ workspaceId: ws.id, name: 'Delete Test Brand', code: 'DTB' });

    const camp = storage.createCampaign({
      id: `cmp-del-${Date.now()}`,
      workspaceId: ws.id,
      brandId: brand.id,
      name: 'Campaign to be Deleted',
      objective: 'Lead Generation',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      description: '',
      status: 'Active',
    });

    const item = storage.createContent({
      id: `cnt-del-${Date.now()}`,
      workspaceId: ws.id,
      brandId: brand.id,
      campaignId: camp.id,
      topic: 'Preserved Content Item',
      contentDate: '2026-11-10',
      scheduledPublishingDate: '2026-11-10',
      platform: 'LinkedIn',
      contentType: 'Static Post',
      objective: 'Lead Generation',
      responsiblePerson: 'Tester',
      status: 'Scheduled',
      caption: '',
      cta: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Tester',
    });

    // Delete campaign
    const deleted = storage.deleteCampaign(camp.id);
    assert.equal(deleted, true);

    // Content item must still exist, but campaignId unlinked
    const preserved = storage.getContent(ws.id).find(c => c.id === item.id);
    assert.ok(preserved, 'Content must not be deleted when campaign is deleted');
    assert.equal(preserved.campaignId, undefined, 'Orphaned campaignId must be uncoupled');

    // Integrity audit must be 100% healthy
    const audit = storage.runIntegrityAudit();
    assert.equal(audit.healthy, true);
  });

  await t.test('Scenario F — Full Platform Integrity Diagnostic Check', () => {
    const report = storage.runIntegrityAudit();
    assert.ok(report, 'Diagnostic report generated');
    assert.equal(report.healthy, true, `Diagnostic check must pass with 0 errors. Report: ${report.summary}`);
    assert.ok(report.totalRecordsChecked.workspaces >= 1);
    assert.ok(report.totalRecordsChecked.brands >= 2);
    assert.ok(report.totalRecordsChecked.content >= 10);
  });

  await t.test('Scenario G — Workspace Deletion and Archiving with Safety Guards', () => {
    // 1. Create a test workspace
    const tempWs = storage.createWorkspace({
      name: 'Temporary Workspace to Delete',
      type: 'Agency',
      industry: 'Growth Tech',
    });
    assert.ok(tempWs.id);

    // Add a brand and content to it
    const tempBrand = storage.createBrand({
      workspaceId: tempWs.id,
      name: 'Temp Brand',
      code: 'TMP',
    });

    const tempContent = storage.createContent({
      id: `cnt-temp-${Date.now()}`,
      workspaceId: tempWs.id,
      brandId: tempBrand.id,
      topic: 'Temp Post',
      contentDate: '2026-11-05',
      scheduledPublishingDate: '2026-11-05',
      platform: 'LinkedIn',
      contentType: 'Static Post',
      objective: 'Brand Awareness',
      responsiblePerson: 'Lead',
      status: 'Planned',
      caption: '',
      cta: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Lead',
    });

    assert.equal(storage.getScopedData(tempWs.id).brands.length, 1);
    assert.equal(storage.getScopedData(tempWs.id).content.length, 1);

    // 2. Archive another created workspace
    const archiveWs = storage.createWorkspace({
      name: 'Workspace to Archive',
      type: 'Client Account',
    });
    const archived = storage.archiveWorkspace(archiveWs.id);
    assert.equal(archived, true);
    // Should no longer appear in active workspaces
    assert.equal(storage.getWorkspaces().some(w => w.id === archiveWs.id), false);
    // But still exists in all workspaces with status 'Archived'
    assert.equal(storage.getAllWorkspaces().find(w => w.id === archiveWs.id)?.status, 'Archived');

    // 3. Permanent delete with cascade
    const deleted = storage.deleteWorkspace(tempWs.id, true);
    assert.equal(deleted, true);
    assert.equal(storage.getWorkspace(tempWs.id), undefined);
    assert.equal(storage.getBrands(tempWs.id).length, 0);

    // Platform integrity must remain 100% clean
    const postAudit = storage.runIntegrityAudit();
    assert.equal(postAudit.healthy, true);
  });
});
