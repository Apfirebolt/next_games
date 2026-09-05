"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import httpClient from "../../plugins/interceptor";

// Custom Dark/Carafe Tooltip Component for Recharts
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-brown/50 bg-carafe/95 p-3 shadow-2xl backdrop-blur-md text-xs">
        <p className="font-bold text-white mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="flex items-center gap-2 font-mono" style={{ color: entry.color }}>
            <span>{entry.name}:</span>
            <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function AdminDashboardPage() {
  const currentUser = useSelector((state) => state.auth?.user);

  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const res = await httpClient.get("admin/analytics");
        setAnalytics(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load admin analytics.");
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser?.isAdmin) {
      fetchAnalytics();
    }
  }, [currentUser]);

  // Transform 30-day registrations for AreaChart
  const registrationChartData = useMemo(() => {
    if (!analytics?.userRegistrationTimeline?.length) return [];
    return analytics.userRegistrationTimeline.map((item) => ({
      date: item._id.slice(5), // "MM-DD" format for cleaner X-axis
      Signups: item.count,
    }));
  }, [analytics]);

  // Transform categories for BarChart
  const categoryChartData = useMemo(() => {
    if (!analytics?.categoryDistribution?.length) return [];
    return analytics.categoryDistribution.map((cat) => ({
      name: cat.title.length > 14 ? `${cat.title.slice(0, 12)}...` : cat.title,
      Threads: cat.threadCount || 0,
      Posts: cat.postCount || 0,
    }));
  }, [analytics]);

  // Transform provider stats for PieChart
  const providerChartData = useMemo(() => {
    if (!analytics?.providerStats?.length) return [];
    return analytics.providerStats.map((prov) => ({
      name: (prov._id || "credentials").toUpperCase(),
      value: prov.count,
    }));
  }, [analytics]);

  const PIE_COLORS = ["#D2B48C", "#4A3728", "#8B5A2B", "#F5DEB3"];

  // Access Control: Admin only
  if (!currentUser?.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-carafe text-sand">
        <Header />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-black text-white">Access Denied</h1>
          <p className="mt-1 text-sm text-tan">Administrative credentials are required to view system metrics.</p>
          <Link
            href="/"
            className="mt-6 rounded-lg bg-brown px-5 py-2.5 text-xs font-bold text-sand transition hover:bg-brown/80 hover:text-white"
          >
            Return Home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const overview = analytics?.overview || {};

  return (
    <div className="flex min-h-screen flex-col bg-carafe text-sand">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner */}
        <div className="rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brown/40 bg-brown/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-tan">
                Live Telemetry
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Platform <span className="text-tan">Analytics</span>
              </h1>
              <p className="mt-1 text-sm text-tan">
                Visual performance metrics, registrations, and content distributions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/moderators"
                className="inline-flex items-center gap-2 rounded-xl bg-tan px-4 py-2.5 text-xs font-bold text-carafe shadow-md transition hover:bg-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                Manage Moderators
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs font-semibold text-red-400">
            {error}
          </div>
        )}

        {/* 1. Stat Counters */}
        <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Total Users", value: overview.totalUsers ?? "—", color: "text-white" },
            { label: "Administrators", value: overview.totalAdmins ?? "—", color: "text-amber-400" },
            { label: "Categories", value: overview.totalCategories ?? "—", color: "text-tan" },
            { label: "Threads", value: overview.totalThreads ?? "—", color: "text-emerald-400" },
            { label: "Posts", value: overview.totalPosts ?? "—", color: "text-sky-400" },
            { label: "Mod Assignments", value: overview.totalModeratorAssignments ?? "—", color: "text-purple-400" },
          ].map((card, idx) => (
            <div key={idx} className="rounded-xl border border-brown/30 bg-brown/10 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-tan/70">{card.label}</p>
              <p className={`mt-1 text-2xl font-black ${card.color}`}>
                {isLoading ? <span className="inline-block h-6 w-12 animate-pulse bg-brown/30 rounded" /> : card.value}
              </p>
            </div>
          ))}
        </section>

        {/* 2. Charts Grid Row 1: Area Chart (Growth) & Pie Chart (Auth Breakdown) */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Chart 1: Registrations Area Chart (2 Cols) */}
          <section className="rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm lg:col-span-2">
            <div className="border-b border-brown/20 pb-3">
              <h2 className="text-base font-bold text-white">Member Growth (Past 30 Days)</h2>
              <p className="text-xs text-tan">Daily user account signups timeline</p>
            </div>

            <div className="mt-6 h-72 w-full">
              {isLoading ? (
                <div className="h-full w-full animate-pulse rounded-xl bg-brown/20" />
              ) : registrationChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-tan/60">
                  No registration entries in the last 30 days.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={registrationChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D2B48C" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#D2B48C" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A3728" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#D2B48C" opacity={0.7} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#D2B48C" opacity={0.7} tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="Signups"
                      stroke="#D2B48C"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorSignups)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Chart 2: Auth Provider Donut Chart (1 Col) */}
          <section className="rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm flex flex-col justify-between">
            <div className="border-b border-brown/20 pb-3">
              <h2 className="text-base font-bold text-white">Auth Distribution</h2>
              <p className="text-xs text-tan">Credentials vs Google OAuth</p>
            </div>

            <div className="my-4 h-56 w-full">
              {isLoading ? (
                <div className="h-full w-full animate-pulse rounded-xl bg-brown/20" />
              ) : providerChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-tan/60">
                  No provider data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={providerChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {providerChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#2C241D" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="flex justify-center gap-4 text-xs">
              {providerChartData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5 font-semibold">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="text-tan">{item.name}:</span>
                  <span className="text-white font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 3. Charts Grid Row 2: Category BarChart (Threads vs Posts) */}
        <section className="mt-8 rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm">
          <div className="border-b border-brown/20 pb-3">
            <h2 className="text-base font-bold text-white">Category Content Density</h2>
            <p className="text-xs text-tan">Comparison of thread count versus post volume per category</p>
          </div>

          <div className="mt-6 h-80 w-full">
            {isLoading ? (
              <div className="h-full w-full animate-pulse rounded-xl bg-brown/20" />
            ) : categoryChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-tan/60">
                No category metrics available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A3728" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#D2B48C" opacity={0.8} tick={{ fontSize: 11 }} interval={0} />
                  <YAxis stroke="#D2B48C" opacity={0.8} tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: "15px", fontSize: "12px", color: "#D2B48C" }} />
                  <Bar dataKey="Threads" fill="#8B5A2B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Posts" fill="#D2B48C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* 4. Top Discussed Threads */}
        <section className="mt-8 rounded-2xl border border-brown/30 bg-brown/10 p-6 backdrop-blur-sm">
          <div className="border-b border-brown/20 pb-3">
            <h2 className="text-base font-bold text-white">Top Discussed Threads</h2>
            <p className="text-xs text-tan">Threads generating the highest community engagement</p>
          </div>

          <div className="mt-4 divide-y divide-brown/20">
            {isLoading ? (
              <div className="space-y-3 py-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-brown/20" />
                ))}
              </div>
            ) : analytics?.topThreads?.length === 0 ? (
              <div className="py-6 text-center text-xs text-tan/60">No threads created yet.</div>
            ) : (
              analytics?.topThreads?.map((thread, i) => (
                <div key={thread._id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-tan/50">#{i + 1}</span>
                    <Link
                      href={`/forums/threads/${thread._id}`}
                      className="text-xs font-bold text-white hover:text-tan transition"
                    >
                      {thread.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-tan/70">
                    <span>{thread.viewsCount || 0} views</span>
                    <span className="rounded bg-brown/30 px-2 py-0.5 text-tan font-bold">
                      {thread.replyCount || 0} replies
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}