import { SkeletonBlock, SkeletonLine } from "@/components/admin/skeletons";

export default function CandidateDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonLine w="w-24" />
        <SkeletonLine w="w-56" />
        <SkeletonLine w="w-64" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-32" />
      </div>
      <SkeletonBlock className="h-64" />
    </div>
  );
}
