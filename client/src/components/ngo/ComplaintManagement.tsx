import React, { useState } from "react";
import { Complaint, ComplaintStatus, ComplaintPriority, Volunteer } from "../../types";
import { StatusBadge } from "../common/StatusBadge";
import { PriorityBadge } from "../common/PriorityBadge";
import { api } from "../../api/client";

interface Props {
  complaints: Complaint[];
  volunteers: Volunteer[];
  onOpenComplaintModal: (complaint: Complaint) => void;
  onRefreshComplaints: () => void;
}

export const ComplaintManagement: React.FC<Props> = ({
  complaints,
  volunteers,
  onOpenComplaintModal,
  onRefreshComplaints
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ComplaintStatus>("Accepted");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter complaints
  const filtered = complaints.filter((c) => {
    if (statusFilter !== "All" && c.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (priorityFilter !== "All" && c.priority !== priorityFilter) {
      return false;
    }
    if (categoryFilter !== "All" && c.category !== categoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.trackingId.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.citizenName.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.pincode.includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedComplaints = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedComplaints.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await api.bulkUpdateStatus(
        selectedIds,
        bulkStatus,
        `Bulk status updated to ${bulkStatus} by NGO Admin.`
      );
      setSelectedIds([]);
      onRefreshComplaints();
    } catch (err) {
      console.error("Bulk update error:", err);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Filters Bar */}
      <div className="bg-white p-6 rounded-3xl card-elevation-1 border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Complaint Management Table
            </h2>
            <p className="text-xs text-slate-500">
              Review, filter, assign ambulances, and track resolution lifecycles.
            </p>
          </div>

          <button
            onClick={onRefreshComplaints}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined !text-base">refresh</span>
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search Bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 !text-base">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by ID, citizen, area..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          >
            <option value="All">All Statuses</option>
            <option value="Reported">Reported (Pending)</option>
            <option value="Accepted">Accepted</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical Only 🚨</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          >
            <option value="All">All Categories</option>
            <option value="Emergency Rescue">Emergency Rescue</option>
            <option value="Injured Dog">Injured Dog</option>
            <option value="Sick Dog">Sick Dog</option>
            <option value="Abandoned Puppy">Abandoned Puppy</option>
            <option value="Aggressive Dog">Aggressive Dog</option>
            <option value="Sterilization Request">Sterilization Request</option>
            <option value="Vaccination Request">Vaccination Request</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when rows selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-lg text-emerald-300">
              check_box
            </span>
            <span className="text-xs font-bold">
              {selectedIds.length} complaints selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-200">Change status to:</span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as ComplaintStatus)}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-white border border-slate-700 focus:outline-none"
            >
              <option value="Accepted">Accepted</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            <button
              onClick={handleBulkUpdate}
              disabled={bulkLoading}
              className="px-4 py-1.5 bg-[#f97316] hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              {bulkLoading ? "Updating..." : "Apply Bulk Update"}
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-3xl card-elevation-1 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      paginatedComplaints.length > 0 &&
                      paginatedComplaints.every((c) => selectedIds.includes(c.id))
                    }
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">Complaint ID</th>
                <th className="p-4">Citizen / Reporter</th>
                <th className="p-4">Category</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Location & Distance</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned Rescuer</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    No complaints match your active filters.
                  </td>
                </tr>
              ) : (
                paginatedComplaints.map((comp) => {
                  const isSelected = selectedIds.includes(comp.id);
                  return (
                    <tr
                      key={comp.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(comp.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* ID + Photo */}
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          {comp.images && comp.images.length > 0 && (
                            <img
                              src={comp.images[0]}
                              alt=""
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          )}
                          <div>
                            <span className="font-mono font-bold text-slate-900 block">
                              #{comp.trackingId}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(comp.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Citizen */}
                      <td className="p-4">
                        <strong className="text-slate-800 block">{comp.citizenName}</strong>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {comp.contactNumber}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="font-semibold text-slate-800 block">{comp.category}</span>
                        {comp.requiredService && (
                          <span className="text-[9px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.2 rounded">
                            {comp.requiredService}
                          </span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="p-4">
                        <PriorityBadge priority={comp.priority} size="sm" />
                      </td>

                      {/* Location & Distance Indicator */}
                      <td className="p-4 max-w-[200px]">
                        <span className="font-medium text-slate-800 truncate block">
                          {comp.address}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                            📍 {comp.distanceKm ? `${comp.distanceKm} KM` : "4.2 KM"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {comp.city}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <StatusBadge status={comp.status} size="sm" />
                      </td>

                      {/* Assigned Volunteer */}
                      <td className="p-4">
                        {comp.volunteerName ? (
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined !text-sm text-emerald-600">
                              person
                            </span>
                            <span className="font-semibold text-slate-800">
                              {comp.volunteerName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Unassigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenComplaintModal(comp)}
                            className="p-1.5 bg-[#006c49] text-white hover:bg-emerald-800 rounded-lg text-xs font-bold shadow-sm transition-colors"
                            title="Inspect Case"
                          >
                            <span className="material-symbols-outlined !text-base">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} complaints
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined !text-sm">chevron_left</span>
            </button>
            <span className="px-3 font-semibold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined !text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
