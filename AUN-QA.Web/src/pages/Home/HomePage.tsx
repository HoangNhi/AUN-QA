import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { MOCK_KPIS, MOCK_RADAR_DATA } from "./constants";

const HomePage = () => {
  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Kho minh chứng Hợp nhất
              </p>
              <h3 className="text-2xl font-bold text-slate-800">1,248</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <ShieldCheck size={20} />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">
            Dữ liệu Single Source of Truth
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">AUN-QA Score</p>
              <h3 className="text-2xl font-bold text-slate-800">5.2/7.0</h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Đạt mức "Adequate" (Thang 1-7)
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Tiến độ MOET 01/2024
              </p>
              <h3 className="text-2xl font-bold text-emerald-600">82%</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Đạt 21/25 tiêu chí định lượng
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Cảnh báo Hết hạn
              </p>
              <h3 className="text-2xl font-bold text-amber-600">5</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-xs text-rose-500 mt-2 font-bold">
            Cần rà soát PDCA ngay
          </p>
        </div>
      </div>

      {/* Dual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AUN Radar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Giao diện AUN-QA (Spider Chart)
              </h3>
              <p className="text-sm text-slate-500">
                Đánh giá 8 nhóm tiêu chuẩn (Thang 1-7)
              </p>
            </div>
            <div className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-bold border border-brand-100 uppercase">
              Chế độ AUN
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="80%"
                data={MOCK_RADAR_DATA}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 7]} />
                <Radar
                  name="Thực tế"
                  dataKey="A"
                  stroke="#0ea5e9"
                  fill="#0ea5e9"
                  fillOpacity={0.4}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MOET Pass/Fail & KPIs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Giao diện MOET (Đạt/Không Đạt)
              </h3>
              <p className="text-sm text-slate-500">
                Chỉ số định lượng theo Thông tư 01/2024
              </p>
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 uppercase">
              Chế độ MOET
            </div>
          </div>
          <div className="space-y-4">
            {MOCK_KPIS.map((kpi) => {
              const percentage = Math.min((kpi.value / kpi.target) * 100, 100);
              const isPassing = kpi.value >= kpi.target;

              return (
                <div key={kpi.id}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {kpi.label}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {kpi.value} / {kpi.target}{" "}
                      <span className="text-xs text-slate-500 font-normal">
                        {kpi.unit}
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-1000 ${
                        isPassing ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <p
                      className={`text-[10px] font-bold uppercase ${
                        isPassing ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {isPassing ? "Đạt chỉ tiêu" : "Dưới ngưỡng rủi ro"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Tiêu chuẩn 5 - MOET
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Site Visit Online
                </p>
                <p className="text-xs font-bold text-brand-600 mt-1">
                  Expert Account Active
                </p>
              </div>
              <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Tự động báo cáo
                </p>
                <button className="text-[10px] font-bold text-emerald-600 mt-1 hover:underline">
                  Xuất bản nháp SAR
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
