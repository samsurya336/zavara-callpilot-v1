import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers'
import type { Knowledge } from '../repositories'
import { KnowledgePage } from './knowledge-page'

const mocks = vi.hoisted(() => ({
  entries: [] as Knowledge[],
  list: vi.fn(),
  create: vi.fn(),
  retry: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('../repositories', () => ({
  knowledgeRepository: {
    list: mocks.list,
    create: mocks.create,
    retry: mocks.retry,
    remove: mocks.remove,
  },
}))

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ session: { user: { id: 'user-id' } } }),
}))

const pdf = (name = 'pricing-guide.pdf') => new File(['Pricing'], name, { type: 'application/pdf' })

beforeEach(async () => {
  mocks.entries = []
  mocks.list.mockImplementation(async (userId: string) =>
    mocks.entries.filter((entry) => entry.createdBy === userId),
  )
  mocks.create.mockImplementation(
    async ({ title, file, createdBy }: { title: string; file: File; createdBy: string }) => {
      const now = new Date().toISOString()
      const entry: Knowledge = {
        id: crypto.randomUUID(),
        title,
        fileUrl: 'blob:knowledge',
        fileType: 'application/pdf',
        fileMeta: { name: file.name, size: file.size },
        fileExtraction: null,
        extractionError: null,
        workerProgress: 'PROCESSING',
        createdBy,
        createdAt: now,
        updatedAt: now,
      }
      mocks.entries = [entry, ...mocks.entries]
      return entry
    },
  )
  mocks.retry.mockResolvedValue(undefined)
  mocks.remove.mockImplementation(async (id: string) => {
    mocks.entries = mocks.entries.filter((entry) => entry.id !== id)
  })
})

function renderPage() {
  return render(
    <AppProviders>
      <main id="main-content" tabIndex={-1}>
        <KnowledgePage />
      </main>
    </AppProviders>,
  )
}

describe('KnowledgePage', () => {
  it('adds a knowledge entry from the empty state', async () => {
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByRole('heading', { name: 'No knowledge items yet' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Add knowledge' }))
    const dialog = screen.getByRole('dialog', { name: 'Add knowledge' })
    await user.upload(within(dialog).getByLabelText('File'), pdf())
    expect(within(dialog).getByLabelText('Title')).toHaveValue('Pricing guide')
    await user.click(within(dialog).getByRole('button', { name: 'Add knowledge' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const row = await screen.findByRole('button', { name: /Pricing guide/ })
    expect(within(row).getByText('Processing')).toBeInTheDocument()
    expect(screen.getByText('1 entry · 0 ready')).toBeInTheDocument()
  })

  it('explains unsupported files and missing titles without submitting', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Add knowledge' }))
    const dialog = screen.getByRole('dialog', { name: 'Add knowledge' })

    await user.upload(within(dialog).getByLabelText('File'), new File(['x'], 'deck.pptx'))
    expect(within(dialog).getByText('Choose a PDF file.')).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('Title'), '   ')
    await user.click(within(dialog).getByRole('button', { name: 'Add knowledge' }))

    expect(within(dialog).getByText('Enter a title.')).toBeInTheDocument()
    expect(await mocks.list('user-id')).toHaveLength(0)
  })

  it('filters entries by status and search text', async () => {
    await mocks.create({ title: 'Pricing guide', file: pdf(), createdBy: 'user-id' })
    await mocks.create({
      title: 'Security overview',
      file: pdf('security.pdf'),
      createdBy: 'user-id',
    })
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByRole('button', { name: /Pricing guide/ })).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Search knowledge' }), 'security')
    expect(screen.queryByRole('button', { name: /Pricing guide/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Security overview/ })).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /^Ready/ }))
    expect(screen.getByRole('heading', { name: 'No matching knowledge' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('shows entry details and deletes after confirmation', async () => {
    await mocks.create({ title: 'Pricing guide', file: pdf(), createdBy: 'user-id' })
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: /Pricing guide/ }))

    const sheet = screen.getByRole('dialog', { name: 'Pricing guide' })
    expect(within(sheet).getByText('pricing-guide.pdf')).toBeInTheDocument()
    expect(within(sheet).getByRole('status')).toHaveTextContent('Extracting readable text')
    expect(within(sheet).getByRole('button', { name: 'Generate challenges' })).toBeDisabled()

    await user.click(within(sheet).getByRole('button', { name: 'Delete' }))
    const confirm = screen.getByRole('alertdialog', { name: 'Delete knowledge?' })
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }))

    expect(await screen.findByRole('heading', { name: 'No knowledge items yet' })).toBeVisible()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus())
  })
})
