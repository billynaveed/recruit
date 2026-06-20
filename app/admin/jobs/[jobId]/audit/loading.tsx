import { SkeletonBlock, SkeletonLine } from "@/components/admin/skeletons";

export default function AuditLoading() {
  return (
    <div className="space-y-4">
      <SkeletonLine w="w-32" />
      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-5">
        <SkeletonLine w="w-32" />
        <SkeletonLine w="w-72" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-8" />
          ))}
        </div>
      </div>
    </div>
  );
}
