export default function DashboardLoading() {
  return (
    <div className="flex flex-1 items-center justify-center h-full min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
