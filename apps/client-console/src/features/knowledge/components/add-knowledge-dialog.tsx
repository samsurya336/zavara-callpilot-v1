import { useState, type FormEvent, type ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { FileText, FileUp, Loader2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateKnowledge } from '../hooks'
import {
  KNOWLEDGE_FILE_ACCEPT,
  KNOWLEDGE_MAX_FILE_SIZE,
  KNOWLEDGE_TITLE_MAX_LENGTH,
  fileTypeLabel,
  formatFileSize,
  knowledgeFileType,
  titleFromFileName,
  validateKnowledgeFile,
} from '../services'
import '@/styles/auth.css'

export function AddKnowledgeDialog({ children }: { children: ReactNode }) {
  const create = useCreateKnowledge()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const changeOpen = (next: boolean) => {
    if (create.isPending) return
    if (next) {
      setTitle('')
      setTitleError(null)
      setFile(null)
      setFileError(null)
      create.reset()
    }
    setOpen(next)
  }

  const chooseFile = (next?: File) => {
    setDragging(false)
    if (!next) return
    const error = validateKnowledgeFile(next)
    setFileError(error)
    setFile(error ? null : next)
    if (!error && !title.trim()) {
      setTitle(titleFromFileName(next.name))
      setTitleError(null)
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextTitleError = title.trim() ? null : 'Enter a title.'
    setTitleError(nextTitleError)
    if (!file) setFileError((error) => error ?? 'Choose a PDF file.')
    if (nextTitleError || !file) return
    create.mutate({ title: title.trim(), file }, { onSuccess: () => setOpen(false) })
  }

  const fileDescription = ['knowledge-file-hint', fileError && 'knowledge-file-error']
    .filter(Boolean)
    .join(' ')

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="knowledge-overlay" />
        <Dialog.Content className="knowledge-dialog glass-sheet animate-fade-in">
          <Dialog.Title className="knowledge-dialog-title pr-14">Add knowledge</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm text-muted-foreground">
            Upload only material you’re authorised to share.
          </Dialog.Description>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="knowledge-dialog-close size-11 rounded-full"
              aria-label="Close"
              title="Close"
              disabled={create.isPending}
            >
              <X aria-hidden="true" />
            </Button>
          </Dialog.Close>
          <form className="mt-7" onSubmit={submit} aria-label="Add knowledge">
            <fieldset className="auth-fields" disabled={create.isPending}>
              <div>
                <label htmlFor="knowledge-title">Title</label>
                <input
                  id="knowledge-title"
                  name="title"
                  required
                  maxLength={KNOWLEDGE_TITLE_MAX_LENGTH}
                  autoComplete="off"
                  className="auth-input"
                  value={title}
                  aria-invalid={Boolean(titleError)}
                  aria-describedby={titleError ? 'knowledge-title-error' : undefined}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    setTitleError(null)
                  }}
                />
                {titleError && (
                  <p id="knowledge-title-error" className="auth-error mt-3">
                    {titleError}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="knowledge-file">File</label>
                <div
                  className="knowledge-dropzone"
                  data-dragging={dragging}
                  data-selected={Boolean(file)}
                  data-invalid={Boolean(fileError)}
                  onDragEnter={() => setDragging(true)}
                  onDragLeave={() => setDragging(false)}
                  onDrop={() => setDragging(false)}
                >
                  <input
                    id="knowledge-file"
                    name="file"
                    type="file"
                    accept={KNOWLEDGE_FILE_ACCEPT}
                    aria-invalid={Boolean(fileError)}
                    aria-describedby={fileDescription}
                    onChange={(event) => chooseFile(event.target.files?.[0])}
                  />
                  <span className="icon-tile">
                    {file ? (
                      <FileText size={22} aria-hidden="true" />
                    ) : (
                      <FileUp size={22} aria-hidden="true" />
                    )}
                  </span>
                  {file ? (
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold wrap-anywhere">{file.name}</span>
                      <span
                        id="knowledge-file-hint"
                        className="mt-1 block text-xs text-muted-foreground"
                      >
                        {fileTypeLabel(knowledgeFileType(file.name) ?? file.type)} ·{' '}
                        {formatFileSize(file.size)} · Choose another file to replace it
                      </span>
                    </span>
                  ) : (
                    <>
                      <span className="mt-3 text-sm font-semibold">Choose a PDF file</span>
                      <span id="knowledge-file-hint" className="text-xs text-muted-foreground">
                        One file per entry, up to {formatFileSize(KNOWLEDGE_MAX_FILE_SIZE)}
                      </span>
                    </>
                  )}
                </div>
                {fileError && (
                  <p id="knowledge-file-error" className="auth-error mt-3">
                    {fileError}
                  </p>
                )}
              </div>
              {create.error && (
                <p role="alert" className="auth-error">
                  {create.error.message}
                </p>
              )}
              <div className="knowledge-dialog-actions">
                <Dialog.Close asChild>
                  <Button type="button" variant="ghost" className="h-12 rounded-full px-5">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button type="submit" className="h-12 rounded-full px-6 shadow-cta">
                  {create.isPending ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload aria-hidden="true" />
                  )}
                  {create.isPending ? 'Uploading...' : 'Add knowledge'}
                </Button>
              </div>
            </fieldset>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
