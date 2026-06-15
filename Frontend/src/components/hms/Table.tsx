'use client';

import React, { useState, useMemo } from 'react';

interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortKey?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  filterFn?: (row: T, query: string) => boolean;
  rowsPerPage?: number;
}

export default function Table<T>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  filterFn,
  rowsPerPage = 5
}: TableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchQuery || !filterFn) return data;
    return data.filter(row => filterFn(row, searchQuery));
  }, [data, searchQuery, filterFn]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    
    return [...filteredData].sort((a: any, b: any) => {
      // Basic sorting logic (string or numeric)
      let valA = a[sortKey];
      let valB = b[sortKey];

      // Handle nested values if needed, but simple fallback is fine
      if (typeof valA === 'object' || typeof valB === 'object') {
        return 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const handleSort = (key: string | undefined) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Input */}
      {filterFn && (
        <div className="relative">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 glass-input text-sm text-gray-200 placeholder-gray-500 focus:outline-none"
          />
        </div>
      )}

      {/* Table Structure */}
      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col.sortKey)}
                  className={`px-6 py-3 cursor-pointer select-none transition-colors hover:text-white ${
                    col.sortKey ? 'hover:bg-white/5' : ''
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.header}</span>
                    {col.sortKey && sortKey === col.sortKey && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-white/5 transition-colors duration-150 ease-in-out text-gray-300"
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 whitespace-nowrap">
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-gray-500 text-sm"
                >
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-gray-400">
          <div>
            Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
            {Math.min(currentPage * rowsPerPage, sortedData.length)} of{' '}
            {sortedData.length} records
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors text-white"
            >
              Prev
            </button>
            <span className="text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
