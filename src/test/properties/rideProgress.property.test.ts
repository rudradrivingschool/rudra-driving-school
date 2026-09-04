// Feature: supabase-only-optimization, Property 1: Initial load issues zero writes

import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import * as fc from 'fast-check';
import { apiClient } from '@/lib/api/client';
import { useRides } from '@/hooks/useRides';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a raw ride row as returned by the API (before the hook maps it).
 * Fields match what fetchRides() accesses: id, client_name, driver_id,
 * client_id, car, date, time, notes, status.
 */
const arbDateString = fc
  .integer({ min: 2020, max: 2030 })
  .chain((year) =>
    fc.record({
      year: fc.constant(year),
      month: fc.integer({ min: 1, max: 12 }),
      day: fc.integer({ min: 1, max: 28 }), // stay in safe range for all months
    }),
  )
  .map(
    ({ year, month, day }) =>
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  );

const arbRideRow = fc.record({
  id: fc.uuid(),
  client_name: fc.string({ minLength: 1, maxLength: 30 }),
  driver_id: fc.option(fc.uuid(), { nil: null }),
  client_id: fc.option(fc.uuid(), { nil: null }),
  car: fc.string({ maxLength: 20 }),
  date: arbDateString,
  time: fc.constantFrom('08:00 AM', '10:30 AM', '02:00 PM', '04:45 PM'),
  notes: fc.string({ maxLength: 50 }),
  status: fc.constantFrom('completed', 'pending', 'cancelled'),
});

const arbRideArray = fc.array(arbRideRow, { minLength: 0, maxLength: 20 });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return { wrapper, queryClient };
}

// ---------------------------------------------------------------------------
// Property 1
// ---------------------------------------------------------------------------

describe('Property 1 — Initial load issues zero writes', () => {
  let getRidesSpy: ReturnType<typeof vi.spyOn>;
  let updateAdmissionSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getRidesSpy = vi
      .spyOn(apiClient, 'getRides')
      .mockResolvedValue([]);

    updateAdmissionSpy = vi
      .spyOn(apiClient, 'updateAdmission')
      .mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it(
    'never calls updateAdmission when rides are loaded on mount',
    async () => {
      await fc.assert(
        fc.asyncProperty(arbRideArray, async (rideRows) => {
          // Wire getRides to return this iteration's generated rows
          getRidesSpy.mockResolvedValue(rideRows);
          // Reset write-spy counter before each iteration
          updateAdmissionSpy.mockClear();

          const { wrapper, queryClient } = makeWrapper();

          const { result, unmount } = renderHook(
            () =>
              useRides({
                drivers: [],
                clients: [],
                onProgressUpdate: undefined,
              }),
            { wrapper },
          );

          try {
            // Wait until the query has settled (isLoading becomes false)
            await waitFor(() => {
              expect(result.current.isLoading).toBe(false);
            }, { timeout: 3000 });

            // Property assertion: zero calls to updateAdmission
            expect(updateAdmissionSpy).not.toHaveBeenCalled();
          } finally {
            // Always unmount and destroy the QueryClient to avoid state leaks
            unmount();
            queryClient.clear();
          }
        }),
        { numRuns: 100 },
      );
    },
    // 100 iterations × ~150ms each — allow generous headroom
    60_000,
  );
});