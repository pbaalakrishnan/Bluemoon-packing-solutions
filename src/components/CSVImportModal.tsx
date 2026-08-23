import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  IMPORT_SECTIONS,
  ImportSectionKey,
  SectionDefinition,
  downloadCSVTemplate,
  processCSVImport,
  ImportResult,
  parseCSV,
  rowsToObjects,
} from '../utils/csvImportEngine';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  FileText,
  RefreshCw,
  Layers,
  ArrowRight,
  Info,
  Check,
  ChevronDown,
} from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSection?: ImportSectionKey;
  onSuccess?: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  defaultSection = 'suppliers',
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSectionKey, setSelectedSectionKey] = useState<ImportSectionKey>(defaultSection);
  const [importMode, setImportMode] = useState<'append_or_update' | 'replace_all'>('append_or_update');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Sync defaultSection prop when modal opens
  React.useEffect(() => {
    if (isOpen && defaultSection) {
      setSelectedSectionKey(defaultSection);
      setSelectedFile(null);
      setFileContent('');
      setPreviewRows([]);
      setImportResult(null);
    }
  }, [isOpen, defaultSection]);

  if (!isOpen) return null;

  const currentSection = IMPORT_SECTIONS.find((s) => s.key === selectedSectionKey) || IMPORT_SECTIONS[0];

  const handleFileChange = (file: File) => {
    if (!file) return;
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      alert('Please upload a valid .csv comma-separated file.');
      return;
    }

    setSelectedFile(file);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileContent(text);
      const parsed = parseCSV(text);
      setPreviewRows(parsed.slice(0, 6)); // Preview first few rows
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate(selectedSectionKey, currentUser?.email || 'admin@bluemoon.in');
  };

  const handleExecuteImport = () => {
    if (!fileContent) {
      alert('Please select or drop a CSV file to import.');
      return;
    }

    if (importMode === 'replace_all') {
      const conf = window.confirm(
        `⚠️ WARNING: You selected "Replace All Existing Records". This will clear existing items in "${currentSection.label}" before importing the CSV records. Are you sure?`
      );
      if (!conf) return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const result = processCSVImport(
        selectedSectionKey,
        fileContent,
        importMode,
        currentUser?.email || 'admin@bluemoon.in'
      );
      setIsProcessing(false);
      setImportResult(result);

      if (result.success && onSuccess) {
        onSuccess();
      }
    }, 400);
  };

  // Group sections by category
  const categories = ['Masters', 'Purchases & Inward', 'Production', 'Sales', 'Audit & Admin'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans text-[#121212] overflow-y-auto">
      <div className="bg-white border border-black/20 w-full max-w-4xl shadow-2xl my-8 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-black/15 flex items-center justify-between bg-[#F8F8F5]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black text-white flex items-center justify-center font-serif font-bold text-base">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-black">Universal CSV Data Importer</h2>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase border border-black/20 bg-white">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-black/60">
                Batch import and update records for any manufacturing, inventory, sales, or master module.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 border border-black/20 hover:bg-black hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section Selection Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-black">
                1. Select Target Module / Section *
              </label>
              <select
                value={selectedSectionKey}
                onChange={(e) => {
                  setSelectedSectionKey(e.target.value as ImportSectionKey);
                  setImportResult(null);
                }}
                className="w-full px-3 py-2.5 bg-white border border-black/20 text-xs font-medium text-black focus:outline-none focus:border-black font-mono cursor-pointer"
              >
                {categories.map((cat) => (
                  <optgroup key={cat} label={`── ${cat.toUpperCase()} ──`}>
                    {IMPORT_SECTIONS.filter((s) => s.category === cat).map((sec) => (
                      <option key={sec.key} value={sec.key}>
                        {sec.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-[11px] text-black/60">{currentSection.description}</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase text-black">
                2. CSV Template
              </label>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full py-2.5 px-3 bg-[#F4F4F1] hover:bg-black hover:text-white border border-black/20 text-black text-xs font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample .CSV</span>
              </button>
              <p className="text-[10px] text-black/50">Includes pre-filled column headers and valid demo records.</p>
            </div>
          </div>

          {/* Import Mode Radio Switch */}
          <div className="border border-black/15 p-4 bg-[#F8F8F5] space-y-3">
            <label className="block text-xs font-mono font-bold uppercase text-black">
              3. Import & Update Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                className={`p-3 border flex items-start gap-3 cursor-pointer transition-all ${
                  importMode === 'append_or_update'
                    ? 'border-black bg-white shadow-xs font-semibold'
                    : 'border-black/15 bg-[#F4F4F1]/60 text-black/70 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="append_or_update"
                  checked={importMode === 'append_or_update'}
                  onChange={() => setImportMode('append_or_update')}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-black font-serif font-bold">Upsert: Append & Update (Recommended)</div>
                  <div className="text-[11px] text-black/60 font-sans font-normal mt-0.5">
                    Updates matching records (by Roll ID, Invoice No, Name, or Email) and appends newly discovered rows without deleting existing inventory.
                  </div>
                </div>
              </label>

              <label
                className={`p-3 border flex items-start gap-3 cursor-pointer transition-all ${
                  importMode === 'replace_all'
                    ? 'border-rose-600 bg-rose-50/50 shadow-xs font-semibold'
                    : 'border-black/15 bg-[#F4F4F1]/60 text-black/70 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="replace_all"
                  checked={importMode === 'replace_all'}
                  onChange={() => setImportMode('replace_all')}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-rose-900 font-serif font-bold">Replace All Section Records</div>
                  <div className="text-[11px] text-rose-700 font-sans font-normal mt-0.5">
                    Clears the active section database table and replaces it entirely with the records in the uploaded CSV.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* File Drag & Drop Box */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase text-black">
              4. Upload CSV File
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                dragActive
                  ? 'border-black bg-[#EFEFEA]'
                  : selectedFile
                  ? 'border-emerald-600 bg-emerald-50/40'
                  : 'border-black/25 bg-white hover:bg-[#F8F8F5] hover:border-black'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,application/vnd.ms-excel"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {selectedFile ? (
                <>
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-black">{selectedFile.name}</div>
                  <div className="text-xs text-black/60 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another file to change
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-black/5 text-black/60 rounded-full flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-black font-mono uppercase tracking-wider">
                    Drag & Drop your .CSV file here or <span className="underline">Browse</span>
                  </div>
                  <div className="text-[11px] text-black/50">
                    Supports standard Excel or Google Sheets exported UTF-8 CSV files
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CSV Preview Table */}
          {previewRows.length > 0 && (
            <div className="border border-black/15 bg-white p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-black">
                <span>CSV File Preview (First {previewRows.length} Rows)</span>
                <span className="text-[10px] text-black/50 font-normal">Parsed successfully</span>
              </div>

              <div className="overflow-x-auto max-h-48 border border-black/10">
                <table className="w-full text-left text-[11px] font-mono border-collapse">
                  <tbody>
                    {previewRows.map((r, rIdx) => (
                      <tr
                        key={rIdx}
                        className={
                          rIdx === 0
                            ? 'bg-[#F4F4F1] font-bold border-b border-black/20 text-black'
                            : 'border-b border-black/5 hover:bg-[#F8F8F5]'
                        }
                      >
                        <td className="p-1.5 px-2.5 text-black/40 border-r border-black/10 w-8 select-none">
                          {rIdx + 1}
                        </td>
                        {r.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="p-1.5 px-2.5 border-r border-black/10 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs"
                          >
                            {cell || <span className="text-black/30 italic font-sans text-[10px]">empty</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Result Notification */}
          {importResult && (
            <div
              className={`p-4 border space-y-2.5 text-xs ${
                importResult.success
                  ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950'
                  : 'border-rose-500 bg-rose-50/60 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold font-serif text-sm">
                {importResult.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Import Completed Successfully</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Import Encountered Issues</span>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono py-1">
                <div className="p-2 bg-white/80 border border-black/10">
                  <div className="text-[10px] text-black/50 uppercase">New Records</div>
                  <div className="text-base font-bold text-emerald-700">{importResult.importedCount}</div>
                </div>
                <div className="p-2 bg-white/80 border border-black/10">
                  <div className="text-[10px] text-black/50 uppercase">Updated Records</div>
                  <div className="text-base font-bold text-blue-700">{importResult.updatedCount}</div>
                </div>
                <div className="p-2 bg-white/80 border border-black/10">
                  <div className="text-[10px] text-black/50 uppercase">Skipped / Errors</div>
                  <div className="text-base font-bold text-rose-700">{importResult.skippedCount}</div>
                </div>
              </div>

              {/* Logs */}
              {importResult.logs.length > 0 && (
                <div className="p-2.5 bg-white/90 border border-black/10 text-[11px] font-mono max-h-32 overflow-y-auto space-y-1">
                  {importResult.logs.map((log, lIdx) => (
                    <div key={lIdx} className="flex items-center gap-1.5 text-black/80">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="p-2.5 bg-rose-100/90 border border-rose-300 text-[11px] font-mono max-h-32 overflow-y-auto space-y-1 text-rose-900">
                  {importResult.errors.map((err, eIdx) => (
                    <div key={eIdx} className="flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-700 shrink-0 mt-0.5" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-black/15 bg-[#F8F8F5] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-black/60 font-mono">
            Target Section: <strong className="text-black">{currentSection.label}</strong>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 border border-black/20 bg-white hover:bg-[#F4F4F1] text-xs font-mono uppercase font-semibold text-black"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isProcessing || !fileContent}
              className="flex-1 sm:flex-initial px-6 py-2 bg-black hover:bg-black/80 text-white text-xs font-sans uppercase tracking-[0.15em] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-xs"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Run CSV Import</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
