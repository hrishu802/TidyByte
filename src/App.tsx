import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { StatsBar } from './components/StatsBar';
import { UploadZone } from './components/UploadZone';
import { ActionBar } from './components/ActionBar';
import { DocumentList } from './components/DocumentList';
import { DemoBanner } from './components/DemoBanner';
import { Notification } from './components/Notification';
import { useDocuments } from './hooks/useDocuments';
import { FolderCheck, Sparkles, ArrowDown, RotateCcw } from 'lucide-react';

export default function App() {
  const {
    documents,
    stats,
    isProcessing,
    isExporting,
    lastExport,
    error,
    successMessage,
    sortField,
    sortOrder,
    setSorting,
    addFiles,
    removeDocument,
    clearAll,
    organizeFiles,
    toggleApproval,
    approveAll,
    unapproveAll,
    startEditing,
    saveEdits,
    cancelEditing,
    exportDocuments,
    downloadLastExport,
    dismissError,
    dismissSuccess,
  } = useDocuments();

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-forest selection:bg-mint selection:text-forest">
      {/* Top Navbar */}
      <Header totalFiles={stats.total} approvedCount={stats.approved} />

      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6">
          {/* Notifications */}
          {error && (
            <Notification type="error" message={error} onDismiss={dismissError} />
          )}
          {successMessage && (
            <Notification
              type="success"
              message={successMessage}
              action={
                lastExport
                  ? {
                      label: 'Download again',
                      onClick: downloadLastExport,
                      icon: <RotateCcw className="w-3.5 h-3.5" />,
                    }
                  : undefined
              }
              onDismiss={dismissSuccess}
            />
          )}

          {/* Hero Section */}
          <section className="text-center sm:text-left pt-2 pb-1">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/5 border border-forest/10 text-xs font-semibold text-forest">
                  <Sparkles className="w-3.5 h-3.5 text-mint-dark" />
                  <span>Slow and Steady Productivity</span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-forest tracking-tight leading-tight">
                  Organize chaotic files with clarity.
                </h1>

                <p className="text-xs sm:text-sm md:text-base text-forest-muted/80 leading-relaxed max-w-xl">
                  Drop messy documents below. TidyByte analyzes filenames and text content to suggest clean names, categories, and descriptions. Review, edit, and export an organized package.
                </p>
              </div>

              {/* Quick feature callout card */}
              <div className="hidden lg:flex flex-col gap-2 p-3.5 rounded-2xl bg-white/70 border border-ivory-dark/60 shadow-2xs text-xs text-forest-muted shrink-0 w-64">
                <div className="flex items-center gap-2 font-semibold text-forest">
                  <FolderCheck className="w-4 h-4 text-emerald-700" />
                  <span>3-Step Workflow</span>
                </div>
                <ol className="space-y-1 text-[11px] list-decimal list-inside text-forest-muted/80">
                  <li>Upload .txt & .pdf documents</li>
                  <li>Click <strong>Organize Files</strong> (Demo)</li>
                  <li>Review & download organized ZIP</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Demo Explanation Banner */}
          <DemoBanner />

          {/* Metrics Ribbon (only when files are loaded) */}
          <StatsBar stats={stats} />

          {/* File Upload Zone */}
          <UploadZone
            onFilesSelected={addFiles}
            disabled={isProcessing}
            totalLoaded={stats.total}
            maxFiles={50}
          />

          {/* Action Toolbar */}
          <ActionBar
            stats={stats}
            isProcessing={isProcessing}
            isExporting={isExporting}
            lastExport={lastExport}
            onOrganize={organizeFiles}
            onApproveAll={approveAll}
            onExport={exportDocuments}
            onDownloadAgain={downloadLastExport}
            onClearAll={clearAll}
          />

          {/* Documents Workspace */}
          {documents.length > 0 ? (
            <DocumentList
              documents={documents}
              sortField={sortField}
              sortOrder={sortOrder}
              onSetSorting={setSorting}
              onToggleApproval={toggleApproval}
              onApproveAll={approveAll}
              onUnapproveAll={unapproveAll}
              onStartEditing={startEditing}
              onSaveEdits={saveEdits}
              onCancelEditing={cancelEditing}
              onRemove={removeDocument}
            />
          ) : (
            /* Empty state when no documents are uploaded yet */
            <div className="rounded-2xl border border-dashed border-ivory-dark/70 bg-white/40 p-8 sm:p-10 text-center">
              <div className="max-w-md mx-auto space-y-2">
                <p className="text-sm font-semibold text-forest">
                  Workspace is currently empty
                </p>
                <p className="text-xs text-forest-muted/70 leading-relaxed">
                  Drag and drop sample .txt or .pdf files into the box above to get started. You can upload up to 50 files in a single batch.
                </p>
                <div className="pt-2 flex items-center justify-center gap-1 text-xs text-forest-muted/50">
                  <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                  <span>Drop files above to organize</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
