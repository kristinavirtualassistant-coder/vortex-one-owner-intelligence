import React, { useState } from 'react';
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
} from 'lucide-react';
import { SearchResultPayload } from '../types';
import { PropertyMap } from './PropertyMap';
import { ProvenanceAuditModal } from './ProvenanceAuditModal';

interface PropertyDetailViewProps {
  data: SearchResultPayload;
  onSaveProperty: (propertyKey: string, note: string) => Promise<void>;
  onRemoveProperty: (propertyKey: string) => Promise<void>;
  onTriggerResearchTask: (entityId: string, entityName: string, reason: string) => void;
}

export const PropertyDetailView: React.FC<PropertyDetailViewProps> = ({
  data,
  onSaveProperty,
  onRemoveProperty,
  onTriggerResearchTask,
}) => {
  const { property, parcel, owner, contacts, provenance, portfolio, researchTasks } = data;

  const [isSaved, setIsSaved] = useState(property.saved || false);
  const [noteText, setNoteText] = useState(property.savedNote || '');
  const [isSaving, setIsSavedLoading] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const handleToggleSave = async () => {
    setIsSavedLoading(true);
    try {
      if (isSaved) {
        await onRemoveProperty(property.propertyKey);
        setIsSaved(false);
      } else {
        await onSaveProperty(property.propertyKey, noteText);
        setIsSaved(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavedLoading(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!isSaved) return;
    setIsSavedLoading(true);
    try {
      await onSaveProperty(property.propertyKey, noteText);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavedLoading(false);
    }
  };

  const leadScore = portfolio?.leadScore || 50;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-mono font-bold">
                APN {parcel.canonicalApn}
              </span>
              <span className="px-3.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-sm font-medium">
                {property.city}, {property.state} {property.zipCode}
              </span>
              <span className="px-3.5 py-1 rounded-full bg-sky-50 text-sky-900 border border-sky-200 text-sm font-medium">
                {parcel.useCode}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {property.formattedAddress}
            </h1>

            <div className="flex items-center space-x-4 text-sm text-slate-600 font-mono">
              <span>Jurisdiction: {property.sourceJurisdiction}</span>
              <span>•</span>
              <span>Roll Year: {parcel.rollYear}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-sm font-semibold flex items-center space-x-2 transition-all shadow-xs"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Audit Provenance ({provenance.length})</span>
            </button>

            <button
              onClick={handleToggleSave}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-2 transition-all shadow-md ${
                isSaved
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-600' : ''}`} />
              <span>{isSaved ? 'Saved Property' : 'Save Property'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spatial GIS Map Container */}
          <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>Spatial GIS Boundary & Coordinates</span>
              </h2>
              <a
                href={property.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-mono font-bold"
              >
                <span>Orange County GIS Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="h-80 w-full rounded-2xl overflow-hidden border border-blue-100">
              <PropertyMap
                latitude={property.latitude}
                longitude={property.longitude}
                formattedAddress={property.formattedAddress}
                apn={parcel.canonicalApn}
              />
            </div>
          </div>

          {/* Public Assessor Parcel Data */}
          <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>County Tax Assessor & Parcel Attributes</span>
              </h2>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold">
                FACT (CONFIDENCE 1.00)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 shadow-xs">
                <span className="text-xs text-slate-600 font-bold uppercase tracking-wider block">
                  Total Assessed Value
                </span>
                <span className="text-xl font-extrabold text-slate-900 font-mono mt-1 block">
                  ${parcel.totalAssessedValue.toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-600 font-bold uppercase tracking-wider block">
                  Land Valuation
                </span>
                <span className="text-lg font-bold text-slate-800 font-mono mt-1 block">
                  ${parcel.landAssessedValue.toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-600 font-bold uppercase tracking-wider block">
                  Improvement Value
                </span>
                <span className="text-lg font-bold text-slate-800 font-mono mt-1 block">
                  ${parcel.improvementAssessedValue.toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-600 font-bold uppercase tracking-wider block">
                  Year Built / Units
                </span>
                <span className="text-lg font-bold text-slate-800 font-mono mt-1 block">
                  {parcel.yearBuilt} ({parcel.units} {parcel.units === 1 ? 'Unit' : 'Units'})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-sm font-mono">
              <div className="flex justify-between py-2 px-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600">APN Format:</span>
                <span className="text-blue-800 font-bold">{parcel.apnFormat}</span>
              </div>
              <div className="flex justify-between py-2 px-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600">Use Code:</span>
                <span className="text-slate-800 font-bold truncate">{parcel.useCode}</span>
              </div>
              <div className="flex justify-between py-2 px-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600">Census Tract:</span>
                <span className="text-slate-800 font-bold">{property.censusTract || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Recorded Owner & Corporate Piercing Card */}
          <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Recorded Owner & Secretary of State Corporate Piercing
                </h2>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  owner.ownerType === 'CORPORATE_ENTITY'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-blue-100 text-blue-900 border border-blue-300'
                }`}
              >
                {owner.ownerType}
              </span>
            </div>

            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-slate-600 uppercase font-bold">Recorded Vesting Name</span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{owner.fullName}</h3>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono px-3 py-1 bg-white border border-blue-200 rounded-xl text-blue-900 font-bold">
                    Mailing Status: {owner.isAbsenteeOwner ? '100% Absentee' : 'Owner Occupied'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono pt-2 border-t border-blue-100">
                <div>
                  <span className="text-xs text-slate-600 uppercase block font-bold">Mailing Address</span>
                  <p className="text-slate-900 font-bold mt-1 font-sans">{owner.mailingAddress}</p>
                </div>

                {owner.corporateOfficerName && (
                  <div>
                    <span className="text-xs text-slate-600 uppercase block font-bold">Secretary of State Officer / Agent</span>
                    <p className="text-blue-900 font-bold mt-1 font-sans">{owner.corporateOfficerName} ({owner.officerTitle})</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) - Contacts & Lead Scoring */}
        <div className="space-y-6">
          {/* Lead Score & Portfolio Card */}
          <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <span>Lead Score & Portfolio</span>
              </h2>
              <span className="text-2xl font-black text-indigo-700 font-mono">{leadScore}/100</span>
            </div>

            {portfolio ? (
              <div className="space-y-4 font-mono text-sm">
                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2">
                  <span className="text-xs text-indigo-900 font-bold uppercase tracking-wider block">
                    Portfolio Aggregation Match
                  </span>
                  <p className="text-base font-bold text-slate-900 font-sans">{portfolio.ownerName}</p>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div>
                      <span className="text-slate-600">Total Holdings: </span>
                      <span className="font-bold text-slate-900">{portfolio.totalProperties} Properties</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Total Value: </span>
                      <span className="font-bold text-slate-900">${(portfolio.totalAssessedValue / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Single asset holding or unlinked portfolio.</p>
            )}
          </div>

          {/* Verified Contacts Card */}
          <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                <span>Verified Direct Contacts</span>
              </h2>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold">
                {contacts.length} Available
              </span>
            </div>

            <div className="space-y-3">
              {contacts.map((contact, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-sm font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      {contact.contactName}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold">
                      {contact.role}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-700 pt-1">
                    {contact.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <a href={`tel:${contact.phoneNumber}`} className="font-bold hover:underline">{contact.phoneNumber}</a>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <a href={`mailto:${contact.email}`} className="font-bold hover:underline">{contact.email}</a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Note Card */}
          <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-md space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <span>Custom Solicitation Note</span>
            </h2>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add personal notes, phone call logs, or acquisition strategy..."
              rows={4}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-sans outline-none text-slate-900 shadow-inner"
            />

            <button
              onClick={handleUpdateNote}
              disabled={!isSaved || isSaving}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-xs transition-all"
            >
              {isSaved ? 'Save Note Updates' : 'Save Property to Enable Notes'}
            </button>
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
