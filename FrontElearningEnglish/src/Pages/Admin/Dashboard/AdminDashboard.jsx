import React, { useEffect, useState, useCallback } from "react";
import { MdTrendingUp, MdPeople, MdAttachMoney, MdSchool, MdPersonAdd } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { adminService } from "../../../Services/adminService";
import adminPaymentService from "../../../Services/adminPaymentService";
import DashboardHeader from "../../../Components/Admin/Dashboard/DashboardHeader/DashboardHeader";
import KPICard from "../../../Components/Admin/Dashboard/KPICard/KPICard";
import RevenueChart from "../../../Components/Admin/Dashboard/RevenueChart/RevenueChart";
import UserDistributionChart from "../../../Components/Admin/Dashboard/UserDistributionChart/UserDistributionChart";
import RevenueBreakdown from "../../../Components/Admin/Dashboard/RevenueBreakdown/RevenueBreakdown";
import RecentTransactions from "../../../Components/Admin/Dashboard/RecentTransactions/RecentTransactions";
import TopCourses from "../../../Components/Admin/Dashboard/TopCourses/TopCourses";
import Skeleton from "../../../Components/Common/Skeleton/Skeleton";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  const [overview, setOverview] = useState({
    totalRevenue: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    newUsersLast30Days: 0,
    newUsersToday: 0
  });
  
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [topCoursesData, setTopCoursesData] = useState([]);
  
  const [userStats, setUserStats] = useState({
    studentCount: 0,
    teacherCount: 0,
    activeUsers: 0,
    blockedUsers: 0
  });

  const [revenueBreakdown, setRevenueBreakdown] = useState({
    fromCourses: 0,
    fromPackages: 0
  });

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, chartRes, userRes, coursesRes] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getRevenueChart(timeRange),
          adminService.getUserStats(),
          adminService.getAllCourses({ pageNumber: 1, pageSize: 5 }) 
      ]);

      if (overviewRes.data?.success) setOverview(overviewRes.data.data);

      if (chartRes.data?.success) {
        const chartDto = chartRes.data.data;
        if (chartDto) {
            setRevenueBreakdown({
                fromCourses: chartDto.courseRevenue || 0,
                fromPackages: chartDto.teacherPackageRevenue || 0
            });

            const courses = chartDto.dailyCourseRevenue || [];
            const packages = chartDto.dailyTeacherPackageRevenue || [];
            
            const mergedChartData = courses.map((item, index) => {
                const packageItem = packages[index] || { amount: 0 };
                return {
                    name: new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                    revenue: (item.amount || 0) + (packageItem.amount || 0),
                    courseRev: item.amount || 0,
                    packageRev: packageItem.amount || 0
                };
            });
            setRevenueChartData(mergedChartData);
        }
      }

      if (userRes.data?.success) {
        const d = userRes.data.data;
        setUserStats({
            studentCount: d.totalStudents || 0,
            teacherCount: d.totalTeachers || 0,
            activeUsers: d.activeUsers || 0,
            blockedUsers: d.blockedUsers || 0
        });
      }

      if (coursesRes.data?.success) {
        setTopCoursesData(coursesRes.data.data.items || []);
      }

    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const fetchRecentTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try {
      const response = await adminPaymentService.getTransactions({ 
        PageNumber: 1, 
        PageSize: 5 
      });
      if (response.data?.success) {
        setRecentTransactions(response.data.data.items);
      }
    } catch (error) {
      console.error("Transactions fetch error:", error);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    fetchRecentTransactions();
  }, [fetchAllData, fetchRecentTransactions]);

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  const formatNumber = (val) => new Intl.NumberFormat('en-US').format(val || 0);

  return (
    <div className="dashboard-container">
      {/* HEADER SECTION */}
      <DashboardHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onRefresh={() => { fetchAllData(); fetchRecentTransactions(); }}
      />

      <div className="dashboard-main-grid">
        {/* KPI SECTION */}
        <section className="kpi-section">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="kpi-metric-card">
                <Skeleton width="40%" height="15px" className="mb-3" />
                <Skeleton width="70%" height="35px" className="mb-2" />
                <Skeleton width="30%" height="12px" />
              </div>
            ))
          ) : (
            <>
              <KPICard
                title="Total Revenue"
                value={overview.totalRevenue}
                formatValue={formatCurrency}
                icon={MdAttachMoney}
                iconColor="var(--fintech-primary)"
                trend="+12.5%"
                isUp={true}
              />

              <KPICard
                title="Total Students"
                value={overview.totalStudents}
                formatValue={formatNumber}
                icon={MdPeople}
                iconColor="var(--fintech-success)"
                subtitle="Active learners"
                trend="+5.2%"
                isUp={true}
              />

              <KPICard
                title="Total Teachers"
                value={overview.totalTeachers}
                formatValue={formatNumber}
                icon={MdSchool}
                iconColor="var(--fintech-warning)"
                subtitle="Content creators"
                trend="-1.4%"
                isUp={false}
              />

              <KPICard
                title="New Users (30d)"
                value={overview.newUsersLast30Days}
                formatValue={formatNumber}
                icon={MdTrendingUp}
                iconColor="var(--fintech-danger)"
                trend="+18%"
                isUp={true}
                subtitle={
                  <>
                    <MdPersonAdd className="me-1" /> Latest Growth
                  </>
                }
              />
            </>
          )}
        </section>

        {/* MAIN DATA SECTION */}
        <div className="dashboard-content-row">
          {/* LEFT COLUMN (Charts & Logs) */}
          <div className="left-column">
            {/* Revenue Chart */}
            {loading ? (
              <div className="dashboard-chart-card">
                <Skeleton width="30%" height="24px" className="mb-4" />
                <Skeleton width="100%" height="350px" />
              </div>
            ) : (
              <RevenueChart
                data={revenueChartData}
                loading={loading}
                formatCurrency={formatCurrency}
              />
            )}

            {/* Recent Transactions */}
            <RecentTransactions 
              transactions={recentTransactions} 
              loading={transactionsLoading} 
              onViewAll={() => navigate("/admin/payment-monitoring")}
            />
          </div>

          {/* RIGHT COLUMN (Breakdowns & Info) */}
          <div className="right-column">
            {loading ? (
              <>
                <div className="dashboard-chart-card">
                  <Skeleton width="50%" height="20px" className="mb-4" />
                  <Skeleton width="100%" height="200px" borderRadius="50%" className="mx-auto" />
                </div>
                <div className="revenue-sources-card">
                  <Skeleton width="60%" height="20px" className="mb-4" />
                  <Skeleton width="100%" height="150px" />
                </div>
              </>
            ) : (
              <>
                <UserDistributionChart userStats={userStats} />
                <RevenueBreakdown
                  breakdown={revenueBreakdown}
                  totalRevenue={overview.totalRevenue}
                  formatCurrency={formatCurrency}
                />
                
                {/* Top Performing Courses Widget */}
                <TopCourses 
                  courses={topCoursesData} 
                  loading={loading} 
                  onViewAll={() => navigate("/admin/courses")} 
                />

                {/* Fintech Insight Card */}
                <div className="kpi-metric-card fintech-insight">
                   <h6 className="fw-bold mb-3">Fintech Intelligence</h6>
                   <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-muted">Average Order Value</span>
                      <span className="fw-bold">{formatCurrency(overview.totalRevenue / (overview.totalStudents || 1))}</span>
                   </div>
                   <div className="d-flex justify-content-between align-items-center">
                      <span className="small text-muted">Conversion Rate</span>
                      <span className="fw-bold text-success">8.4%</span>
                   </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
