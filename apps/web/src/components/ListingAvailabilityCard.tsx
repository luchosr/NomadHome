import { t } from "@nomadhome/shared";
import { formatDate } from "../lib/dates.js";
import { Button, Card, Input } from "@nomadhome/ui";
import { ServerErrorAlert } from "./ServerErrorAlert.js";
import { LABEL_CLASS } from "./listingFormStyles.js";

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
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold text-fg">{t("host.availability.title")}</h2>
      {blocks.length === 0 ? (
        <p className="text-fg-muted">{t("host.availability.no_blocks")}</p>
      ) : (
        <ul className="mb-4 space-y-2">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-none border-2 border-border p-3"
            >
              <span className="text-sm tabular-nums text-fg">
                {formatDate(block.startDate)} – {formatDate(block.endDate)}
              </span>
              <Button
                variant="destructive"
                className="min-h-11"
                onClick={() => deleteBlock(block.id)}
              >
                {t("host.availability.delete")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label htmlFor="avail-start" className={LABEL_CLASS}>
            {t("host.availability.start_label")}
          </label>
          <Input
            id="avail-start"
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="avail-end" className={LABEL_CLASS}>
            {t("host.availability.end_label")}
          </label>
          <Input
            id="avail-end"
            type="date"
            value={endDate}
            min={startDate || today}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button onClick={addBlock} disabled={!startDate || !endDate}>
          {t("host.availability.block")}
        </Button>
      </div>
      <ServerErrorAlert error={blockError} className="mt-3" />
    </Card>
  );
}
