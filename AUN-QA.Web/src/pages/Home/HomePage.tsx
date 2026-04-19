import { AlertTriangle, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useDashboardCycles } from "@/features/business/routes/Dashboard/hooks/useDashboardCycles";
import CycleChartSlide from "@/features/business/routes/Dashboard/components/CycleChartSlide";
import { useEffect, useState } from "react";

const HomePage = () => {
  const { data: cycles = [], isLoading, isError } = useDashboardCycles();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const syncNow = () => setNow(Date.now());
    syncNow();

    const timer = window.setInterval(syncNow, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const totalEvidence = cycles.reduce((sum, cycle) => sum + cycle.Stats.EvidenceCount, 0);
  const averageProgress =
    cycles.length > 0
      ? Math.round(
          cycles.reduce((sum, cycle) => sum + cycle.Stats.ProgressPercent, 0) /
            cycles.length,
        )
      : 0;
  const totalWarnings = cycles.filter((cycle) => {
    if (!cycle.Deadline || !now) {
      return false;
    }

    const daysLeft = Math.ceil((new Date(cycle.Deadline).getTime() - now) / 86400000);

    return daysLeft >= 0 && daysLeft <= 30;
  }).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Chu kỳ active</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {isLoading ? "—" : cycles.length}
              </h3>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <ShieldCheck size={20} />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Đang tham gia</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Kho minh chứng</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {isLoading ? "—" : totalEvidence.toLocaleString()}
              </h3>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Single Source of Truth</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Tiến độ TB</p>
              <h3 className="text-2xl font-bold text-emerald-600">
                {isLoading || cycles.length === 0 ? "—" : `${averageProgress}%`}
              </h3>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Trung bình tất cả chu kỳ</p>
        </div>

        <div className="rounded-2xl border border-l-4 border-amber-500 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Deadline sắp tới</p>
              <h3 className="text-2xl font-bold text-amber-600">
                {isLoading ? "—" : totalWarnings}
              </h3>
            </div>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="mt-2 text-xs font-medium text-rose-500">Trong vòng 30 ngày</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50 shadow-sm">
        <div className="border-b border-slate-200/80 px-5 py-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
            Chu kỳ đang tham gia
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Mỗi slide hiển thị đúng kiểu biểu đồ được cấu hình cho StandardSet.
          </p>
        </div>

        <div className="p-5">
          {isLoading && (
            <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70">
              <RefreshCw size={20} className="animate-spin text-slate-400" />
            </div>
          )}

          {isError && (
            <div className="flex h-56 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-sm text-red-500">
              Không thể tải dữ liệu. Vui lòng thử lại.
            </div>
          )}

          {!isLoading && !isError && cycles.length === 0 && (
            <div className="flex h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
              Bạn chưa tham gia chu kỳ đánh giá nào đang hoạt động.
            </div>
          )}

          {!isLoading && !isError && cycles.length > 0 && (
            <>
              <Carousel opts={{ align: "start" }} className="w-full">
                <CarouselContent>
                  {cycles.map((cycle) => (
                    <CarouselItem key={cycle.CycleId}>
                      <CycleChartSlide cycle={cycle} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {cycles.length > 1 && (
                  <>
                    <CarouselPrevious className="-left-2" />
                    <CarouselNext className="-right-2" />
                  </>
                )}
              </Carousel>

              {cycles.length > 1 && <CarouselDots className="mt-4" />}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
