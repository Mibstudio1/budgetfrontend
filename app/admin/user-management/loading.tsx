import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-32" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 lg:px-6 py-3 text-left">
                        <Skeleton className="h-4 w-16" />
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left">
                        <Skeleton className="h-4 w-20" />
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left">
                        <Skeleton className="h-4 w-12" />
                      </th>
                      <th className="px-3 lg:px-6 py-3 text-left">
                        <Skeleton className="h-4 w-24" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-3 lg:px-6 py-4">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="px-3 lg:px-6 py-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-3 lg:px-6 py-4">
                          <Skeleton className="h-6 w-16" />
                        </td>
                        <td className="px-3 lg:px-6 py-4">
                          <div className="flex space-x-1">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

