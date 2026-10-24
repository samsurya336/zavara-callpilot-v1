import { useRef, useState } from 'react'
import { AlertDialog, Dialog } from 'radix-ui'
import { ExternalLink, FileText, Loader2, RotateCcw, Swords, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDeleteKnowledge, useRetryKnowledge } from '../hooks'
import type { Knowledge } from '../repositories'
import {
  fileTypeLabel,
  formatFileSize,
  formatKnowledgeDateTime,
  knowledgeStatus,
} from '../services'
import { KnowledgeStatusLabel } from './knowledge-status'
import '@/styles/auth.css'

const EXTRACTION_PREVIEW_LENGTH = 20_000

function ExtractedText({ entry }: { entry: Knowledge }) {
  const retry = useRetryKnowledge()
  const status = knowledgeStatus(entry)
  const text = entry.fileExtraction?.trim() ?? ''

  return (
    <section className="knowledge-sheet-section" aria-labelledby="knowledge-extraction-heading">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="knowledge-extraction-heading" className="text-base font-semibold">
          Extracted text
        </h3>
        {status === 'ready' && text && (
          <p className="text-xs text-muted-foreground">
            {text.length.toLocaleString('en')} characters
          </p>
        )}
      </div>
      {status === 'processing' && (
        <p role="status" className="knowledge-note">
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          Extracting readable text. It appears here when ready.
        </p>
      )}
      {status === 'failed' && (
        <>
          <p className="auth-error">
            {entry.extractionError ||
              'We couldn’t read text from this PDF. Scanned, empty or password-protected files can’t be processed.'}
          </p>
          {retry.error && (
            <p role="alert" className="auth-error mt-3">
              {retry.error.message}
            </p>
          )}
          <Button
            variant="secondary"
            className="mt-5 h-11 rounded-full px-5"
            disabled={retry.isPending}
            onClick={() => retry.mutate(entry.id)}
          >
            {retry.isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw aria-hidden="true" />
            )}
            {retry.isPending ? 'Retrying...' : 'Try again'}
          </Button>
        </>
      )}
      {status === 'ready' &&
        (text ? (
          <>
            <div
              role="region"
              aria-labelledby="knowledge-extraction-heading"
              tabIndex={0}
              className="knowledge-extraction"
            >
              {text.slice(0, EXTRACTION_PREVIEW_LENGTH)}
            </div>
            {text.length > EXTRACTION_PREVIEW_LENGTH && (
              <p className="mt-3 text-xs text-muted-foreground">
                Showing the first {EXTRACTION_PREVIEW_LENGTH.toLocaleString('en')} characters.
              </p>
            )}
          </>
        ) : (
          <p className="knowledge-note">No readable text was found in this file.</p>
        ))}
    </section>
  )
}

function DeleteKnowledge({
  entry,
  onDeleting,
}: {
  entry: Knowledge
  onDeleting: (deleting: boolean) => void
}) {
  const remove = useDeleteKnowledge()
  const [open, setOpen] = useState(false)

  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !remove.isPending && setOpen(next)}>
      <AlertDialog.Trigger asChild>
        <Button variant="ghost" className="h-11 flex-1 rounded-full px-5 sm:flex-none">
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="knowledge-overlay knowledge-alert-overlay" />
        <AlertDialog.Content className="knowledge-dialog knowledge-alert glass-sheet animate-fade-in">
          <AlertDialog.Title className="knowledge-dialog-title">
            Delete knowledge?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-3 text-sm text-muted-foreground wrap-anywhere">
            “{entry.title}” and its extracted text will be permanently removed.
          </AlertDialog.Description>
          {remove.error && (
            <p role="alert" className="auth-error mt-5">
              {remove.error.message}
            </p>
          )}
          <div className="knowledge-dialog-actions mt-7">
            <AlertDialog.Cancel asChild>
              <Button
                variant="ghost"
                className="h-12 rounded-full px-5"
                disabled={remove.isPending}
              >
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              className="h-12 rounded-full px-6 shadow-cta"
              disabled={remove.isPending}
              onClick={() => {
                onDeleting(true)
                remove.mutate(entry.id, { onError: () => onDeleting(false) })
              }}
            >
              {remove.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
              {remove.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

function KnowledgeDetails({ entry, onGenerate }: { entry: Knowledge; onGenerate: () => void }) {
  const deleting = useRef(false)
  const status = knowledgeStatus(entry)

  return (
    <Dialog.Content
      className="knowledge-sheet glass-sheet"
      onCloseAutoFocus={(event) => {
        if (!deleting.current) return
        event.preventDefault()
        document.getElementById('main-content')?.focus()
      }}
    >
      <header className="knowledge-sheet-header">
        <p className="section-label mb-3">Knowledge</p>
        <Dialog.Title className="knowledge-dialog-title pr-14">{entry.title}</Dialog.Title>
        <Dialog.Description className="sr-only">File details and extracted text</Dialog.Description>
        <div className="mt-4">
          <KnowledgeStatusLabel status={status} />
        </div>
        <Dialog.Close asChild>
          <Button
            variant="ghost"
            size="icon"
            className="knowledge-dialog-close size-11 rounded-full"
            aria-label="Close details"
            title="Close details"
          >
            <X aria-hidden="true" />
          </Button>
        </Dialog.Close>
      </header>
      <div className="knowledge-sheet-body">
        <section className="knowledge-sheet-section" aria-labelledby="knowledge-file-heading">
          <h3 id="knowledge-file-heading" className="mb-4 text-base font-semibold">
            File
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <span className="icon-tile">
              <FileText size={22} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold wrap-anywhere">{entry.fileMeta.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {fileTypeLabel(entry.fileType)} · {formatFileSize(entry.fileMeta.size)}
              </p>
            </div>
            {entry.fileUrl ? (
              <Button asChild variant="secondary" className="h-11 rounded-full px-4">
                <a href={entry.fileUrl} target="_blank" rel="noreferrer">
                  Open
                  <span className="sr-only"> file in a new tab</span>
                  <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">File unavailable</span>
            )}
          </div>
          <dl className="knowledge-facts mt-6">
            <div>
              <dt>Added</dt>
              <dd>
                <time dateTime={entry.createdAt}>{formatKnowledgeDateTime(entry.createdAt)}</time>
              </dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>
                <time dateTime={entry.updatedAt}>{formatKnowledgeDateTime(entry.updatedAt)}</time>
              </dd>
            </div>
          </dl>
        </section>
        <ExtractedText entry={entry} />
      </div>
      <footer className="knowledge-sheet-footer">
        <DeleteKnowledge
          entry={entry}
          onDeleting={(value) => {
            deleting.current = value
          }}
        />
        <Button
          className="h-11 flex-1 rounded-full px-5 shadow-cta sm:flex-none"
          disabled={status !== 'ready'}
          onClick={onGenerate}
        >
          <Swords aria-hidden="true" />
          Generate challenges
        </Button>
      </footer>
    </Dialog.Content>
  )
}

export function KnowledgeDetailsSheet({
  entry,
  onClose,
  onGenerate,
}: {
  entry?: Knowledge
  onClose: () => void
  onGenerate: () => void
}) {
  return (
    <Dialog.Root
      open={Boolean(entry)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="knowledge-overlay" />
        {entry && <KnowledgeDetails key={entry.id} entry={entry} onGenerate={onGenerate} />}
      </Dialog.Portal>
    </Dialog.Root>
  )
}
