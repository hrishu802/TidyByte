import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, FileCheck2, ArrowUpRight } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  disabled?: boolean;
  totalLoaded?: number;
  maxFiles?: number;
}

export function UploadZone({
  onFilesSelected,
  disabled = false,
  totalLoaded = 0,
  maxFiles = 50,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);

      if (disabled) return;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const filesArray = Array.from(e.dataTransfer.files);
        onFilesSelected(filesArray);
      }
    },
    [onFilesSelected, disabled],
  );

  const handleTriggerClick = useCallback(() => {
    // If the click directly hit the input or a button, don't duplicate
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        // Safe snapshot of the file list
        const filesArray = Array.from(e.target.files);
        // Reset file input so identical file can be picked again intentionally
        e.target.value = '';
        onFilesSelected(filesArray);
      }
    },
    [onFilesSelected],
  );

  return (
    <div
      className={`
        relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden
        ${isDragging
          ? 'border-mint bg-mint/15 shadow-md scale-[1.005]'
          : 'border-ivory-dark/80 bg-white/70 hover:border-mint-dark/60 hover:bg-white/90 shadow-xs'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleTriggerClick}
      role="button"
      tabIndex={0}
      aria-label="Upload documents"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTriggerClick();
        }
      }}
    >
      {/* Hidden file input with stopPropagation to avoid double trigger */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".txt,.pdf,text/plain,application/pdf"
        className="sr-only"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onChange={handleChange}
        disabled={disabled}
      />

      <div className="px-4 py-8 sm:py-10 md:py-12 flex flex-col items-center text-center">
        {/* Animated icon badge */}
        <div
          className={`
            w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-transform duration-200
            ${isDragging
              ? 'bg-forest text-mint scale-110 shadow-sm'
              : 'bg-ivory-warm text-forest-muted group-hover:scale-105'
            }
          `}
        >
          {isDragging ? (
            <FileCheck2 className="w-6 h-6 animate-pulse" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        {/* Primary prompt */}
        <h3 className="text-base sm:text-lg font-semibold text-forest tracking-tight">
          {isDragging ? 'Drop your documents to begin' : 'Upload documents to organize'}
        </h3>
        <p className="text-xs sm:text-sm text-forest-muted/70 mt-1 max-w-md">
          Drag & drop your files here, or{' '}
          <span className="font-semibold text-forest underline underline-offset-4 decoration-mint-dark decoration-2">
            browse from your device
          </span>
        </p>

        {/* Format specifications & limits */}
        <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-forest-muted/75">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ivory-warm/80 font-medium border border-ivory-dark/40">
            <FileText className="w-3.5 h-3.5 text-forest" />
            .txt
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-medium border border-rose-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            .pdf
          </span>
          <span className="hidden sm:inline text-ivory-dark">•</span>
          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-normal">
            Max 50 MB per file
          </span>
          <span className="hidden sm:inline text-ivory-dark">•</span>
          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-normal">
            Up to {maxFiles} files ({totalLoaded}/{maxFiles} loaded)
          </span>
        </div>

        {/* Touch button specifically for mobile clarity */}
        <div className="mt-4 sm:hidden">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-4 py-2 rounded-xl bg-forest text-ivory min-h-[44px]">
            Select Files <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
