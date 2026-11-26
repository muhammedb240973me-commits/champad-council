"use client";

import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Download,
  Upload,
  Plus,
  Save,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const POSITION_OPTIONS = [
  "Councilor",
  "Unit President",
  "Unit Gen. Secretary",
  "Unit Secretary",
  "Sector Executive",
];

const DEFAULT_UNITS = [
  "Ponniam",
  "Mele Champad",
  "Aerool",
  "Thazhe Champad",
  "Arayakool",
  "Quraishikkara",
  "Manekkara",
  "South Panniyannur",
  "Panniyannur",
];

interface CouncilorRow {
  tempId: string;
  name: string;
  mobile: string;
  unit: string;
  position: string;
}

export default function DelegateDataPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [rows, setRows] = useState<CouncilorRow[]>([]);
  const [unitList, setUnitList] = useState<string[]>(DEFAULT_UNITS);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>("ALL");
  const [customUnitInput, setCustomUnitInput] = useState("");
  const [showAddUnit, setShowAddUnit] = useState(false);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load existing councilors from database on mount
  useEffect(() => {
    fetch("/api/admin/councilors")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.councilors) && data.councilors.length > 0) {
          const loaded: CouncilorRow[] = data.councilors.map(
            (c: {
              id: string;
              name: string;
              mobile: string;
              unit: string;
              position: string;
            }) => ({
              tempId: c.id,
              name: c.name,
              mobile: c.mobile,
              unit: c.unit,
              position: POSITION_OPTIONS.includes(c.position)
                ? c.position
                : "Councilor",
            })
          );
          setRows(loaded);

          // Merge DB units into filter dropdown
          const dbUnits = Array.from(
            new Set(loaded.map((r) => r.unit).filter(Boolean))
          );
          setUnitList((prev) => Array.from(new Set([...prev, ...dbUnits])));
        } else {
          // Start with one blank row ready for input
          setRows([
            {
              tempId: crypto.randomUUID(),
              name: "",
              mobile: "",
              unit: "",
              position: "Councilor",
            },
          ]);
        }
      });
  }, []);

  // Download required Excel format (.xlsx)
  const handleDownloadFormat = () => {
    const sampleData = [
      {
        Name: "Muhammed Shamil",
        "Mobile Number": "9876543210",
        Unit: "Champad",
        Position: "Councilor",
      },
      {
        Name: "Abdulla K",
        "Mobile Number": "9876543211",
        Unit: "Panniyannur",
        Position: "Unit President",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    worksheet["!cols"] = [{ wch: 24 }, { wch: 16 }, { wch: 18 }, { wch: 22 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Councilors");
    XLSX.writeFile(workbook, "SSF_Champad_Councilors_Format.xlsx");
  };

  // Upload Excel or CSV file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMsg(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          firstSheet
        );

        const defaultUnit =
          selectedUnitFilter !== "ALL" ? selectedUnitFilter : "";

        const parsedRows: CouncilorRow[] = jsonRows
          .map((item) => {
            // Case-insensitive column lookup
            const normalized: Record<string, string> = {};
            Object.keys(item).forEach((k) => {
              normalized[k.trim().toLowerCase()] = String(item[k] ?? "").trim();
            });

            const name = normalized["name"] || normalized["full name"] || "";
            const mobile = (
              normalized["mobile number"] ||
              normalized["mobile"] ||
              normalized["phone"] ||
              ""
            )
              .replace(/\D/g, "")
              .slice(-10);

            const unit = normalized["unit"] || defaultUnit;
            const rawPos = normalized["position"] || "Councilor";
            const matchedPos =
              POSITION_OPTIONS.find(
                (p) => p.toLowerCase() === rawPos.toLowerCase()
              ) || "Councilor";

            return {
              tempId: crypto.randomUUID(),
              name,
              mobile,
              unit,
              position: matchedPos,
            };
          })
          .filter((r) => r.name || r.mobile);

        if (parsedRows.length === 0) {
          setStatusMsg({
            type: "error",
            text: "No valid rows found in file. Use the Download Format template.",
          });
          return;
        }

        // Update unit list with any new units from the uploaded sheet
        const uploadedUnits = parsedRows.map((r) => r.unit).filter(Boolean);
        setUnitList((prev) => Array.from(new Set([...prev, ...uploadedUnits])));

        // Replace blank initial rows or append uploaded records
        setRows((prev) => {
          const nonEmpty = prev.filter((r) => r.name.trim() || r.mobile.trim());
          return [...nonEmpty, ...parsedRows];
        });

        setStatusMsg({
          type: "success",
          text: `Loaded ${parsedRows.length} row(s) from ${file.name}. Review and click "Save to Database".`,
        });
      } catch {
        setStatusMsg({
          type: "error",
          text: "Could not read file. Please upload a valid .xlsx or .csv file.",
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Add a blank row (inherits selected Unit filter & defaults Position to "Councilor")
  const handleAddRow = () => {
    const defaultUnit =
      selectedUnitFilter !== "ALL" ? selectedUnitFilter : "";

    setRows((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        name: "",
        mobile: "",
        unit: defaultUnit,
        position: "Councilor",
      },
    ]);
  };

  const handleRowChange = (
    tempId: string,
    field: keyof CouncilorRow,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.tempId === tempId ? { ...row, [field]: value } : row
      )
    );
  };

  const handleRemoveRow = (tempId: string) => {
    setRows((prev) => prev.filter((row) => row.tempId !== tempId));
  };

  const handleAddCustomUnit = () => {
    const trimmed = customUnitInput.trim();
    if (!trimmed) return;
    if (!unitList.includes(trimmed)) {
      setUnitList((prev) => [...prev, trimmed]);
    }
    setSelectedUnitFilter(trimmed);
    setCustomUnitInput("");
    setShowAddUnit(false);
  };

  // Save valid rows to Neon PostgreSQL
  const handleSaveToDatabase = async () => {
    setStatusMsg(null);
    const validRows = rows.filter(
      (r) =>
        r.name.trim().length > 0 &&
        r.mobile.replace(/\D/g, "").length >= 10 &&
        r.unit.trim().length > 0
    );

    if (validRows.length === 0) {
      setStatusMsg({
        type: "error",
        text: "Please enter at least one complete row with Name, 10-digit Mobile Number, and Unit.",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/councilors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ councilors: validRows }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg({
          type: "success",
          text: data.message,
        });
      } else {
        setStatusMsg({
          type: "error",
          text: data.error || "Failed to save councilors.",
        });
      }
    } catch {
      setStatusMsg({
        type: "error",
        text: "Network error while saving to database.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Filtered view based on Unit filter
  const visibleRows =
    selectedUnitFilter === "ALL"
      ? rows
      : rows.filter(
          (r) =>
            r.unit.toLowerCase() === selectedUnitFilter.toLowerCase() ||
            r.unit === ""
        );

  return (
    <div className="space-y-6">
      {/* Top Bar: Title on Left, Stacked Format + Upload Buttons on Top Right */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Delegate &amp; Councilor Data
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload an Excel/CSV sheet or enter councilors directly into the
            table below.
          </p>
        </div>

        {/* Top-Right Stacked Action Buttons */}
        <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadFormat}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Download Format
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            Upload Excel / CSV File
          </button>
        </div>
      </div>

      {/* Unit Filter Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Filter className="h-4 w-4 text-emerald-600" />
            <span>Filter by Unit:</span>
          </div>

          <select
            value={selectedUnitFilter}
            onChange={(e) => setSelectedUnitFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm font-medium focus:border-emerald-600 focus:outline-none"
          >
            <option value="ALL">All Units ({rows.length})</option>
            {unitList.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>

          {!showAddUnit ? (
            <button
              type="button"
              onClick={() => setShowAddUnit(true)}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              + New Unit
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={customUnitInput}
                onChange={(e) => setCustomUnitInput(e.target.value)}
                placeholder="Enter unit name"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomUnit}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddUnit(false)}
                className="px-2 py-1.5 text-xs text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {selectedUnitFilter !== "ALL" && (
          <span className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
            New rows will default to Unit: <strong>{selectedUnitFilter}</strong>
          </span>
        )}
      </div>

      {/* Status Banner */}
      {statusMsg && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            statusMsg.type === "success"
              ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200"
              : "border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Editable Councilors Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-3.5 px-4 w-16">Sl No.</th>
                <th className="py-3.5 px-4 min-w-[200px]">Name</th>
                <th className="py-3.5 px-4 min-w-[160px]">Mobile Number</th>
                <th className="py-3.5 px-4 min-w-[170px]">Unit</th>
                <th className="py-3.5 px-4 min-w-[200px]">Position</th>
                <th className="py-3.5 px-4 w-14 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-slate-400 text-sm"
                  >
                    No councilors listed for this filter. Click &quot;+ Add
                    Councilor Row&quot; below.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row, index) => (
                  <tr
                    key={row.tempId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-2.5 px-4 font-semibold text-slate-500">
                      {index + 1}
                    </td>

                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) =>
                          handleRowChange(row.tempId, "name", e.target.value)
                        }
                        placeholder="Councilor full name"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </td>

                    <td className="py-2.5 px-4">
                      <input
                        type="tel"
                        maxLength={10}
                        value={row.mobile}
                        onChange={(e) =>
                          handleRowChange(
                            row.tempId,
                            "mobile",
                            e.target.value.replace(/\D/g, "")
                          )
                        }
                        placeholder="10-digit mobile"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </td>

                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        list="unit-suggestions"
                        value={row.unit}
                        onChange={(e) =>
                          handleRowChange(row.tempId, "unit", e.target.value)
                        }
                        placeholder="Unit name"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm focus:border-emerald-600 focus:outline-none"
                      />
                    </td>

                    <td className="py-2.5 px-4">
                      <select
                        value={row.position}
                        onChange={(e) =>
                          handleRowChange(
                            row.tempId,
                            "position",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm focus:border-emerald-600 focus:outline-none"
                      >
                        {POSITION_OPTIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.tempId)}
                        aria-label="Remove row"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Autocomplete list for Unit inputs */}
        <datalist id="unit-suggestions">
          {unitList.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
      </div>

      {/* Bottom Action Bar: Add Row + Save to Database */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <Plus className="h-4 w-4 text-emerald-600" />
          Add Councilor Row
        </button>

        <button
          type="button"
          onClick={handleSaveToDatabase}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold shadow-md transition cursor-pointer"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving to Neon..." : "Save to Database"}
        </button>
      </div>
    </div>
  );
}