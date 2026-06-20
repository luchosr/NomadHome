import { useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "@nomadhome/shared";
import { Badge, Button } from "@nomadhome/ui";
import { adminApi, type AdminListing } from "../api/admin.js";

function listingStatusTone(status: AdminListing["status"]): "success" | "neutral" | "danger" {
  switch (status) {
    case "PUBLISHED":
      return "success";
    case "DRAFT":
      return "neutral";
    case "DISABLED":
      return "danger";
  }
}

export function AdminListingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "listings"],
    queryFn: () => adminApi.listListings(),
  });

  const handleDisable = async (id: string) => {
    await adminApi.disableListing(id);
    void queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
  };

  const handleEnable = async (id: string) => {
    await adminApi.enableListing(id);
    void queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
  };

  if (isLoading) return <p className="text-slate-500">Loading...</p>;

  if (error || !data) {
    return (
      <p role="alert" className="text-red-600">
        {t("error.generic.unexpected")}
      </p>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">{t("admin.listings.title")}</h1>

      {data.data.length === 0 ? (
        <p className="text-slate-600">{t("admin.listings.no_listings")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4 font-medium">{t("admin.listings.title_col")}</th>
                <th className="pb-2 pr-4 font-medium">{t("admin.listings.type_col")}</th>
                <th className="pb-2 pr-4 font-medium">{t("admin.listings.city_col")}</th>
                <th className="pb-2 pr-4 font-medium">{t("admin.listings.host_col")}</th>
                <th className="pb-2 pr-4 font-medium">{t("admin.listings.status_col")}</th>
                <th className="pb-2 font-medium">{t("admin.listings.actions_col")}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((listing: AdminListing) => (
                <tr key={listing.id} className="border-b border-slate-200 last:border-0">
                  <td className="py-3 pr-4 text-slate-900">{listing.title}</td>
                  <td className="py-3 pr-4 text-slate-600">{listing.type}</td>
                  <td className="py-3 pr-4 text-slate-600">{listing.city}</td>
                  <td className="py-3 pr-4 text-slate-600">{listing.host.email}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={listingStatusTone(listing.status)}>{listing.status}</Badge>
                  </td>
                  <td className="py-3">
                    {listing.status !== "DISABLED" ? (
                      <Button variant="destructive" onClick={() => void handleDisable(listing.id)}>
                        {t("admin.listings.disable")}
                      </Button>
                    ) : (
                      <Button variant="secondary" onClick={() => void handleEnable(listing.id)}>
                        {t("admin.listings.enable")}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
