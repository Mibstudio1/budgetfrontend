import React from "react"
import { Button } from "@/components/ui/button"
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  usePagination 
} from "@/components/ui/pagination"

interface PaginationControlsProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationControls({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  className
}: PaginationControlsProps) {
  const { totalPages, pageNumbers, hasNextPage, hasPrevPage } = usePagination(
    totalItems,
    itemsPerPage,
    currentPage
  )

  if (totalPages <= 1) {
    return null
  }

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (hasPrevPage) {
                onPageChange(currentPage - 1)
              }
            }}
            className={!hasPrevPage ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {pageNumbers.map((page, index) => (
          <PaginationItem key={index}>
            {page === "..." ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(page as number)
                }}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (hasNextPage) {
                onPageChange(currentPage + 1)
              }
            }}
            className={!hasNextPage ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

// Simple pagination info component
export function PaginationInfo({
  totalItems,
  itemsPerPage,
  currentPage,
  className
}: {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  className?: string
}) {
  const { startIndex, endIndex, totalPages } = usePagination(
    totalItems,
    itemsPerPage,
    currentPage
  )

  if (totalItems === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        ไม่พบข้อมูล
      </div>
    )
  }

  return (
    <div className={`text-sm text-gray-500 ${className}`}>
      แสดง {startIndex + 1}-{endIndex} จาก {totalItems} รายการ
      {totalPages > 1 && ` (หน้า ${currentPage} จาก ${totalPages})`}
    </div>
  )
}
