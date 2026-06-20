import { SkeletonBlock, SkeletonLine, SkeletonRow } from "@/components/admin/skeletons";

export default function JobDetailLoading() {
  return (
    <div className="-mx-4 -my-4 sm:-mx-6 sm:-my-6">
      <div className="overflow-hidden border-y border-slate-200 bg-white sm:rounded-lg sm:border">
        <div className="space-y-3 border-b border-slate-200 px-6 py-5">
          <SkeletonLine w="w-16" />
          <SkeletonLine w="w-48" />
          <SkeletonLine w="w-64" />
        </div>
        <div className="flex gap-4 border-b border-slate-200 px-6 py-3">
          <SkeletonLine w="w-20" />
          <SkeletonLine w="w-20" />
          <SkeletonLine w="w-24" />
        </div>
        <div className="space-y-2 px-6 py-3">
          <SkeletonBlock className="h-8" />
        </div>
        <div className="px-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
