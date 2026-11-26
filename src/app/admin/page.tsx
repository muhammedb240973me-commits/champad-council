"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  Percent,
  Upload,
  Share2,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface Councilor {
  id: string;
  name: string;
  mobile: string;
  unit: string;
  position: string;
  isCheckedIn: boolean;
  checkedInAt: string | null;
}

export default function AdminAnalyticsPage() {
  const [councilors, setCouncilors] = useState<Councilor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCouncilors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/councilors");
      if (res.ok) {
        const data = await res.json();
        setCouncilors(data.councilors || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouncilors();
  }, []);

  const stats = useMemo(() => {
    const total = councilors.length;
    const checkedIn = councilors.filter((c) => c.isCheckedIn).length;
    const pending = total - checkedIn;
    const percentage = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    // Group by Unit
    const unitMap: Record<
      string,
      { unit: string; total: number; checkedIn: number; pending: number }
    > = {};

    councilors.forEach((c) => {
      const u = c.unit || "Unassigned";
      if (!unitMap[u]) {
        unitMap[u] = { unit: u, total: 0, checkedIn: 0, pending: 0 };
      }
      unitMap[u].total += 1;
      if (c.isCheckedIn) unitMap[u].checkedIn += 1;
      else unitMap[u].pending += 1;
    });

    const unitData = Object.values(unitMap).sort((a, b) =>
      a.unit.localeCompare(b.unit)
    );

    // Group by Position
    const posMap: Record<
      string,
      { position: string; checkedIn: number; pending: number }
    > = {};

    councilors.forEach((c) => {
      const p = c.position || "Councilor";
      if (!posMap[p]) {
        posMap[p] = { position: p, checkedIn: 0, pending: 0 };
      }
      if (c.isCheckedIn) posMap[p].checkedIn += 1;
      else posMap[p].pending += 1;
    });

    const positionData = Object.values(posMap);

    return { total, checkedIn, pending, percentage, unitData, positionData };
  }, [councilors]);

  const handleShareWhatsApp = () => {
    const unitLines =
      stats.unitData.length > 0
        ? stats.unitData
            .map(
              (u) =>
                `• *${u.unit}*: ${u.checkedIn}/${u.total} Checked In (${
                  u.total > 0 ? Math.round((u.checkedIn / u.total) * 100) : 0
                }%)`
            )
            .join("\n")
        : "• No unit records available yet.";

    const message = [
      `*SSF Champad Sector Students' Council*`,
      `📊 *Live Check-in Statistics*`,
      ``,
      `✅ *Total Checked In:* ${stats.checkedIn} / ${stats.total} (${stats.percentage}%)`,
      `⏳ *Pending:* ${stats.pending}`,
      ``,
      `*Unit-wise Status:*`,
      unitLines,
      ``,
      ``,
      `© SSF Champad Sector`,
    ].join("\n");

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const pieData = [
    { name: "Checked In", value: stats.checkedIn, color: "#10b981" },
    { name: "Pending", value: stats.pending, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Council Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time check-in overview across units and council positions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCouncilors}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <Link
            href="/admin/delegates"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 transition"
          >
            <Upload className="h-4 w-4" />
            Upload Delegate Data
          </Link>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            Share Statistics
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>TOTAL COUNCILORS</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>CHECKED IN</span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.checkedIn}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>PENDING</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
            {stats.pending}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>TURNOUT RATE</span>
            <Percent className="h-4 w-4 text-purple-500" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold">
            {stats.percentage}%
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart: Overall Check-in Ratio */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-base font-semibold mb-4">
            Overall Check-in Status
          </h2>
          <div className="h-64 w-full">
            {stats.total === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No delegate data uploaded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar Chart: Unit-wise Breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-base font-semibold mb-4">
            Unit-wise Attendance Breakdown
          </h2>
          <div className="h-64 w-full">
            {stats.unitData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                Upload delegate records to see unit charts
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.unitData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="unit" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="checkedIn"
                    name="Checked In"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="pending"
                    name="Pending"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Position-wise Bar Chart & Unit Summary Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-base font-semibold mb-4">
            Position-wise Breakdown
          </h2>
          <div className="h-64 w-full">
            {stats.positionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No position data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.positionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="position"
                    width={130}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="checkedIn"
                    name="Checked In"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="pending"
                    name="Pending"
                    fill="#94a3b8"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Unit Status Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 overflow-x-auto">
          <h2 className="text-base font-semibold mb-4">
            Unit Check-in Summary
          </h2>
          <table className="w-full text-sm text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2.5 pr-4">Unit Name</th>
                <th className="py-2.5 px-3 text-center">Checked In</th>
                <th className="py-2.5 px-3 text-center">Total</th>
                <th className="py-2.5 pl-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.unitData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    No records found.
                  </td>
                </tr>
              ) : (
                stats.unitData.map((u) => {
                  const pct =
                    u.total > 0 ? Math.round((u.checkedIn / u.total) * 100) : 0;
                  return (
                    <tr key={u.unit}>
                      <td className="py-2.5 pr-4 font-medium">{u.unit}</td>
                      <td className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        {u.checkedIn}
                      </td>
                      <td className="py-2.5 px-3 text-center">{u.total}</td>
                      <td className="py-2.5 pl-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}