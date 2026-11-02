import React, { useState } from 'react';
import { MarketingProvider, useMarketing } from './context/MarketingContext';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { Header } from './components/Header';
import { ContentModal } from './components/ContentModal';
import { UserGuideModal } from './components/UserGuideModal';

import { OverviewView } from './views/OverviewView';
import { BrandsView } from './views/BrandsView';
import { CalendarView } from './views/CalendarView';
import { PlanningView } from './views/PlanningView';
import { ProductionView } from './views/ProductionView';
import { CampaignsView } from './views/CampaignsView';
import { AnalyticsView } from './views/AnalyticsView';
import { TeamView } from './views/TeamView';
import { WorkspacesView } from './views/WorkspacesView';
import { SettingsView } from './views/SettingsView';

function DashboardApp() {
  const { isOffline, isLoading } = useMarketing();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          openUserGuide={() => setIsUserGuideOpen(true)}
        />
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-white flex flex-col z-10 shadow-2xl">
            <Sidebar
              currentTab={currentTab}
              onSelectTab={tab => {
                setCurrentTab(tab);
                setIsMobileMenuOpen(false);
              }}
              openUserGuide={() => {
                setIsUserGuideOpen(true);
                setIsMobileMenuOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          openUserGuide={() => setIsUserGuideOpen(true)}
          onOpenCreateBrand={() => setCurrentTab('brands')}
        />

        {!isLoading && isOffline && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs">
            <span>Not connected to PostgreSQL. No browser copy or demo data is being used. Enter the API token in Settings and run Test Access.</span>
            <button
              type="button"
              onClick={() => setCurrentTab('settings')}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-900 text-white font-semibold"
            >
              Open Settings
            </button>
          </div>
        )}
        {/* View Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto pb-12">
            {currentTab === 'overview' && (
              <OverviewView onOpenCreateBrand={() => setCurrentTab('brands')} />
            )}
            {currentTab === 'brands' && <BrandsView />}
            {currentTab === 'calendar' && <CalendarView />}
            {currentTab === 'planning' && <PlanningView />}
            {currentTab === 'production' && <ProductionView />}
            {currentTab === 'campaigns' && <CampaignsView />}
            {currentTab === 'analytics' && <AnalyticsView />}
            {currentTab === 'team' && <TeamView />}
            {currentTab === 'workspaces' && (
              <WorkspacesView
                onSelectWorkspace={() => setCurrentTab('overview')}
                onNavigateOverview={() => setCurrentTab('overview')}
              />
            )}
            {currentTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <ContentModal />
      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <MarketingProvider>
      <DashboardApp />
    </MarketingProvider>
  );
}
