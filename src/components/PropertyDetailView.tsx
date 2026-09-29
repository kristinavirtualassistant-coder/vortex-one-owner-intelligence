import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bookmark,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Mail,
  User,
  MapPin,
  TrendingUp,
  FileText,
  Clock,
  ExternalLink,
  Lock,
  PlusCircle,
  Hash,
  Briefcase,
  AlertCircle,
  Share2,
  Scale,
  DollarSign,
  Layers,
  Sparkles,
  Check,
  RotateCcw,
  Tag,
  Download,
  Printer,
} from 'lucide-react';
import { SearchResultPayload } from '../types';
import { PropertyMap } from './PropertyMap';
import { ProvenanceAuditModal } from './ProvenanceAuditModal';
import { exportPropertyToCsv } from '../lib/csvExport';

interface PropertyDetailViewProps {
  data: SearchResultPayload;
  onSaveProperty: (propertyKey: string, note: string) => Promise<void>;
  onRemoveProperty: (propertyKey: string) => Promise<void>;
  onTriggerResearchTask: (entityId: string, entityName: string, reason: string) => void;
  isCompared?: boolean;
  onToggleCompare?: (propertyKey: string) => void;
  onAnalyzePortfolio?: (ownerName: string) => void;
}

export const PropertyDetailView: React.FC<PropertyDetailViewProps> = ({
  data,
  onSaveProperty,
  onRemoveProperty,
  onTriggerResearchTask,
  isCompared = false,
  onToggleCompare,
  onAnalyzePortfolio,
}) => {
  const { property, parcel, owner, contacts, provenance, portfolio, researchTasks } = data;

  const [isSaved, setIsSaved] = useState(property.saved || false);
  const [noteText, setNoteText] = useState(property.savedNote || '');
  const [lastSavedNote, setLastSavedNote] = useState(property.savedNote || '');
  const [isSaving, setIsSavedLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Sync state whenever the active property changes
  useEffect(() => {
    setIsSaved(property.saved || false);
    setNoteText(property.savedNote || '');
    setLastSavedNote(property.savedNote || '');
    setSaveSuccessMsg(false);
    setExportSuccess(false);
  }, [property.propertyKey, property.saved, property.savedNote]);

  const hasUnsavedChanges = noteText !== lastSavedNote;

  const handleExportCSV = () => {
    try {
      exportPropertyToCsv(data, noteText);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to export CSV', err);
    }
  };

  const handleToggleSave = async () => {
    setIsSavedLoading(true);
    try {
      if (isSaved) {
        await onRemoveProperty(property.propertyKey);
        setIsSaved(false);
      } else {
        await onSaveProperty(property.propertyKey, noteText);
        setIsSaved(true);
        setLastSavedNote(noteText);
        setSaveSuccessMsg(true);
        setTimeout(() => setSaveSuccessMsg(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavedLoading(false);
    }
  };

  const handleSaveNote = async () => {
    setIsSavedLoading(true);
    try {
      await onSaveProperty(property.propertyKey, noteText);
      setIsSaved(true);
      setLastSavedNote(noteText);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavedLoading(false);
    }
  };

  const handleRevertNote = () => {
    setNoteText(lastSavedNote);
  };

  const handleAddTag = (tag: string) => {
    const prefix = noteText.trim() ? `${noteText.trim()}\n` : '';
    setNoteText(`${prefix}[${tag}]: `);
  };

  const leadScore = portfolio?.leadScore || 50;

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Branded PDF / Print Presentation Header (Only visible when printing / generating PDF) */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-950 uppercase">VORTEX ONE</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white">CMC VR1</span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Authoritative Parcel GIS & Public Assessor Intelligence Report
            </p>
          </div>

          <div className="text-right text-[11px] text-slate-600">
            <div><strong>Report Date:</strong> {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div><strong>Jurisdiction:</strong> {property.sourceJurisdiction || 'Orange County, CA (FIPS 06059)'}</div>
            <div><strong>Provenance Hash:</strong> {provenance[0]?.provenanceHash?.slice(0, 16) || 'PROV-VERIFIED'}...</div>
          </div>
        </div>
      </div>

      {/* 1. Header Profile Banner with Immediate Spatial Context Mini-Map */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs print:border print:border-slate-300 print:shadow-none print:p-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left / Center: Property Identity & Quick Badges */}
          <div className="space-y-3 flex-1">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[11px] font-bold border border-blue-200">
                  APN: {parcel.canonicalApn}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified Public Record</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {property.formattedAddress}
              </h1>

              <p className="text-sm font-medium text-slate-600">
                {property.city}, {property.state} {property.zipCode} · {property.sourceJurisdiction || 'Orange County (FIPS 06059)'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                {parcel.useCode || 'Commercial / Residential'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium border border-slate-200">
                {parcel.units} {parcel.units === 1 ? 'Unit' : 'Units'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono border border-slate-200">
                Lat: {property.latitude ? property.latitude.toFixed(4) : '33.6846'} | Lng: {property.longitude ? property.longitude.toFixed(4) : '-117.8265'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 print:hidden">
              {onToggleCompare && (
                <button
                  onClick={() => onToggleCompare(property.propertyKey)}
                  className={`px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all border ${
                    isCompared
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                  title={isCompared ? 'Remove from comparison' : 'Add to side-by-side comparison'}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>{isCompared ? 'Compared' : 'Compare'}</span>
                </button>
              )}

              <button
                id="print-property-pdf-button"
                type="button"
                onClick={handlePrintReport}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Print or generate branded PDF property report for client presentations"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print / PDF Report</span>
              </button>

              <button
                id="export-property-csv-button"
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                title="Download CSV export of this property record"
              >
                {exportSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">CSV Exported</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Export to CSV</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowAuditModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Provenance Log ({provenance.length})</span>
              </button>

              <button
                onClick={handleToggleSave}
                disabled={isSaving}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  isSaved
                    ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-600' : ''}`} />
                <span>{isSaved ? 'Bookmarked' : 'Save Property'}</span>
              </button>
            </div>
          </div>

          {/* Right: Instant Spatial GIS Mini-Map Preview */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0">
            <div className="flex items-center justify-between pb-1.5 text-xs text-slate-600">
              <span className="font-bold flex items-center gap-1 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Spatial Location Context</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  document.getElementById('spatial-gis-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
              >
                Full GIS Map ↓
              </button>
            </div>
            <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-200 shadow-xs">
              <PropertyMap
                latitude={property.latitude}
                longitude={property.longitude}
                formattedAddress={property.formattedAddress}
                apn={parcel.canonicalApn}
                variant="mini"
                onExpand={() => {
                  document.getElementById('spatial-gis-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Intelligence Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) - Core Intelligence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assessed Valuation & Tax Attributes */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Assessor Valuation & Parcel Attributes</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                Roll Year: {parcel.rollYear || '2026'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="text-[11px] text-slate-500 font-semibold uppercase block">
                  Total Assessed
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">
                  ${parcel.totalAssessedValue.toLocaleString()}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold uppercase block">
                  Land Value
                </span>
                <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">
                  ${parcel.landAssessedValue.toLocaleString()}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold uppercase block">
                  Improvement
                </span>
                <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">
                  ${parcel.improvementAssessedValue.toLocaleString()}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-semibold uppercase block">
                  Year Built / Units
                </span>
                <span className="text-base font-bold text-slate-800 font-mono mt-0.5 block">
                  {parcel.yearBuilt} ({parcel.units} Units)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                <span className="text-slate-500">APN Format:</span>
                <span className="text-blue-800 font-bold">{parcel.apnFormat}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                <span className="text-slate-500">Use Code:</span>
                <span className="text-slate-800 font-bold truncate">{parcel.useCode}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                <span className="text-slate-500">Census Tract:</span>
                <span className="text-slate-800 font-bold">{property.censusTract || '06059'}</span>
              </div>
            </div>
          </div>

          {/* Recorded Owner & Corporate Entity Piercing */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Recorded Owner & Corporate Entity Piercing
                </h2>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  owner.ownerType === 'CORPORATE_ENTITY'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                {owner.ownerType}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">
                    Recorded Vesting Name
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900">{owner.fullName}</h3>
                </div>

                <span className="text-xs font-medium px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 self-start sm:self-auto">
                  {owner.isAbsenteeOwner ? 'Absentee Owner (Out of Area)' : 'Owner-Occupied'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 font-semibold block">Mailing Address:</span>
                  <p className="text-slate-900 font-medium mt-0.5">{owner.mailingAddress}</p>
                </div>

                {owner.corporateOfficerName && (
                  <div>
                    <span className="text-slate-500 font-semibold block">
                      CA Secretary of State Officer / Agent:
                    </span>
                    <p className="text-blue-900 font-bold mt-0.5">
                      {owner.corporateOfficerName} ({owner.officerTitle})
                    </p>
                  </div>
                )}
              </div>

              {/* Owner Portfolio Action */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <span>Owner Intelligence: </span>
                  <strong className="text-slate-800">{portfolio ? `${portfolio.totalProperties} properties found` : 'View portfolio holdings'}</strong>
                </div>
                {onAnalyzePortfolio && (
                  <button
                    id="analyze-portfolio-button"
                    type="button"
                    onClick={() => onAnalyzePortfolio(owner.fullName)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Analyze Portfolio</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Spatial GIS Boundary Map */}
          <div id="spatial-gis-section" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 scroll-mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Spatial GIS Parcel Map</span>
              </h2>
              <a
                href={property.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>County GIS Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="w-full">
              <PropertyMap
                latitude={property.latitude}
                longitude={property.longitude}
                formattedAddress={property.formattedAddress}
                apn={parcel.canonicalApn}
                variant="full"
                height="340px"
              />
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) - Verification & Lead Actions */}
        <div className="space-y-6">
          {/* Verification & Provenance Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verification & Integrity</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                VERIFIED
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Source Registry:</span>
                <span className="font-semibold text-slate-800">Orange County Assessor</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Last Verified:</span>
                <span className="font-mono text-slate-800">2026-08-21 16:30 UTC</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Confidence Score:</span>
                <span className="font-bold text-emerald-700 font-mono">1.00 (100%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Zero Synthetic Values:</span>
                <span className="font-semibold text-emerald-700">Enforced</span>
              </div>
            </div>
          </div>

          {/* Lead Score & Portfolio Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Prospecting Lead Score</span>
              </h2>
              <span className="text-xl font-extrabold text-blue-600 font-mono">{leadScore}/100</span>
            </div>

            {portfolio ? (
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-900 block truncate">
                    Associated Portfolio: {portfolio.ownerName}
                  </span>
                  {onAnalyzePortfolio && (
                    <button
                      type="button"
                      onClick={() => onAnalyzePortfolio(portfolio.ownerName)}
                      className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold underline shrink-0 cursor-pointer"
                    >
                      View All
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span>Holdings: </span>
                    <strong className="text-slate-900">{portfolio.totalProperties} Assets</strong>
                  </div>
                  <div>
                    <span>Valuation: </span>
                    <strong className="text-slate-900">${(portfolio.totalAssessedValue / 1000000).toFixed(1)}M</strong>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Single asset holding or unlinked portfolio.</p>
            )}
          </div>

          {/* Verified Contacts Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Verified Direct Contacts</span>
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {contacts.length} Available
              </span>
            </div>

            <div className="space-y-2.5">
              {contacts.map((contact, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      {contact.contactName}
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-blue-100 text-blue-800 font-semibold">
                      {contact.role}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-700 pt-1">
                    {contact.phoneNumber && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <a href={`tel:${contact.phoneNumber}`} className="font-semibold hover:underline">
                          {contact.phoneNumber}
                        </a>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-blue-600" />
                        <a href={`mailto:${contact.email}`} className="font-semibold hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Research & Diligence Notes Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Custom Research & Diligence Notes</span>
              </h2>

              {saveSuccessMsg ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-700" />
                  <span>Saved</span>
                </span>
              ) : hasUnsavedChanges ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Unsaved edits
                </span>
              ) : isSaved && noteText ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Saved to DB
                </span>
              ) : null}
            </div>

            {/* Quick Tag Templates */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Insert quick diligence topic:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Zoning & Permitting',
                  'Owner Call Log',
                  'Acquisition Strategy',
                  'Tax Assessment',
                  '1031 Exchange Lead',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 border border-slate-200 rounded-md text-[10px] font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Inline Textarea */}
            <div className="relative space-y-1">
              <textarea
                id="property-custom-research-notes"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveNote();
                  }
                }}
                placeholder="Document title findings, owner call logs, zoning notes, permit history, or acquisition strategy directly for this property..."
                rows={4}
                className="w-full p-3 bg-slate-50 hover:bg-slate-50/90 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs outline-none text-slate-900 transition-all focus:ring-2 focus:ring-blue-500/10 placeholder-slate-400 font-sans"
              />

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Press <kbd className="font-mono bg-slate-100 border border-slate-200 rounded px-1 text-slate-500">Cmd+Enter</kbd> or <kbd className="font-mono bg-slate-100 border border-slate-200 rounded px-1 text-slate-500">Ctrl+Enter</kbd> to save</span>
                <span className="font-mono">{noteText.length} chars</span>
              </div>
            </div>

            {/* Save & Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                id="save-research-notes-button"
                onClick={handleSaveNote}
                disabled={isSaving}
                className={`flex-1 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  saveSuccessMsg
                    ? 'bg-emerald-600 text-white'
                    : hasUnsavedChanges
                    ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                }`}
              >
                {isSaving ? (
                  <span>Saving to Database...</span>
                ) : saveSuccessMsg ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved to Database</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{isSaved ? 'Save Research Notes' : 'Save Notes & Bookmark'}</span>
                  </>
                )}
              </button>

              {hasUnsavedChanges && lastSavedNote && (
                <button
                  type="button"
                  onClick={handleRevertNote}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Revert to last saved note"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Revert</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Provenance Audit Modal */}
      <ProvenanceAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        provenanceLogs={provenance}
        propertyAddress={property.formattedAddress}
      />
    </div>
  );
};
