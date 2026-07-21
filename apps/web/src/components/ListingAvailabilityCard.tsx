import { t } from "@nomadhome/shared";
import { formatDate } from "../lib/dates.js";
import { Button, Card, Input } from "@nomadhome/ui";

interface Block {
  id: string;
  startDate: string;
  endDate: string;
}

interface Props {
  blocks: Block[];
  startDate: string;
  endDate: string;
  blockError: string | null;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
  addBlock: () => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
}

export function ListingAvailabilityCard({
  blocks,
  startDate,
  endDate,
  blockError,
  setStartDate,
  setEndDate,
  addBlock,
  deleteBlock,
}: Props) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-fg-1">{t("host.availability.title")}</h2>
      {blocks.length === 0 ? (
        <p className="text-fg-3">{t("host.availability.no_blocks")}</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="flex items-center justify-between rounded-md border border-muted p-3"
            >
              <span className="text-sm text-fg-2">
                {formatDate(block.startDate)} – {formatDate(block.endDate)}
              </span>
              <Button variant="destructive" onClick={() => deleteBlock(block.id)}>
                {t("host.availability.delete")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label htmlFor="avail-start" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.availability.start_label")}
          </label>
          <Input
            id="avail-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="avail-end" className="mb-1 block text-sm font-medium text-fg-2">
            {t("host.availability.end_label")}
          </label>
          <Input
            id="avail-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button onClick={addBlock} disabled={!startDate || !endDate}>
          {t("host.availability.block")}
        </Button>
      </div>
      {blockError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {blockError}
        </p>
      )}
    </Card>
  );
}
