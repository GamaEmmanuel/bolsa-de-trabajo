export default function JobDetailLoading() {
  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-32 mb-6" />
          <div className="bg-white p-8 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-7 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded-full w-24" />
                  <div className="h-6 bg-gray-200 rounded-full w-20" />
                </div>
              </div>
            </div>
            <div className="h-px bg-gray-200 my-6" />
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
