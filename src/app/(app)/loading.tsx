export default function AppLoading() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background px-6 pt-5">
      <div className="skeleton h-5 w-32 rounded mb-4" />
      <div className="skeleton h-[140px] rounded-[22px] mb-4" />
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="skeleton h-[80px] rounded-2xl" />
        <div className="skeleton h-[80px] rounded-2xl" />
        <div className="skeleton h-[80px] rounded-2xl" />
      </div>
      <div className="skeleton h-[120px] rounded-2xl mb-4" />
      <div className="space-y-2.5">
        <div className="skeleton h-[60px] rounded-2xl" />
        <div className="skeleton h-[60px] rounded-2xl" />
        <div className="skeleton h-[60px] rounded-2xl" />
      </div>
    </div>
  );
}
