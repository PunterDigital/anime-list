<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Markdown } from '@tiptap/markdown'
import { useToast } from '@/composables/useToast'
import {
    BLOG_IMAGE_ACCEPT,
    altFromFileName,
    isBlogImageFile,
    uploadBlogImage,
} from '@/composables/useBlogImageUpload'

// Card 4479: the blog post editor. A TipTap rich-text editor that reads and
// writes Markdown (the stored source), with a "Markdown" toggle that shows the
// raw text to edit or paste an AI-written draft. Switching back loads the
// Markdown into the rich editor, so nothing is lost either way.
//
// The editor owns the text: the model is only written, never read back after
// mount. Reading it back raced with typing (the parent's prop arrives a tick
// later, so an older value replaced newer keystrokes). The edit page keeps
// its form state across saves, so nothing replaces the body from outside.

const model = defineModel<string>({ required: true })

const props = withDefaults(defineProps<{ invalid?: boolean }>(), { invalid: false })

const markdownMode = ref(false)
const raw = ref(model.value)
const toast = useToast()

// Card 4480: uploads from the toolbar button, a paste or a drop.
const fileInput = ref<HTMLInputElement | null>(null)
const markdownInput = ref<HTMLTextAreaElement | null>(null)
const uploading = ref(0)

function imageFiles(list: FileList | null | undefined): File[] {
    return Array.from(list ?? []).filter(isBlogImageFile)
}

/**
 * Upload the files one by one and insert each as an image with alt text
 * (asked for, with the file name as a start). `pos` is where a drop landed;
 * otherwise the image goes at the cursor.
 */
async function insertUploads(files: File[], pos?: number) {
    for (const file of files) {
        uploading.value++
        try {
            const image = await uploadBlogImage(file)
            const alt = (window.prompt('Image description (alt text)', altFromFileName(file.name)) ?? '').trim()
            insertImage(image.url, alt, pos)
            pos = undefined
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Upload failed',
                detail: `${file.name}: ${error instanceof Error ? error.message : 'unknown error'}`,
                life: 6000,
            })
        } finally {
            uploading.value--
        }
    }
}

function insertImage(src: string, alt: string, pos?: number) {
    if (markdownMode.value) {
        const el = markdownInput.value
        const markdown = `![${alt.replace(/[[\]]/g, '')}](${src})`
        const start = el?.selectionStart ?? raw.value.length
        const end = el?.selectionEnd ?? start
        const before = raw.value.slice(0, start)
        const after = raw.value.slice(end)
        const lead = before === '' || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
        raw.value = `${before}${lead}${markdown}\n\n${after}`
        model.value = raw.value
        return
    }
    const e = editor.value
    if (!e) return
    const content = { type: 'image', attrs: { src, alt } }
    if (pos !== undefined) {
        e.chain().focus().insertContentAt(pos, content).run()
    } else {
        e.chain().focus().insertContent(content).run()
    }
}

function chooseFiles() {
    fileInput.value?.click()
}

function onFilesChosen(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    input.value = ''
    const images = files.filter(isBlogImageFile)
    if (images.length < files.length) {
        toast.add({ severity: 'warn', summary: 'Skipped', detail: 'Only JPEG, PNG, WebP and GIF images can be uploaded.', life: 6000 })
    }
    void insertUploads(images)
}

function onMarkdownDrop(event: DragEvent) {
    const files = imageFiles(event.dataTransfer?.files)
    if (files.length === 0) return
    event.preventDefault()
    void insertUploads(files)
}

function onMarkdownPaste(event: ClipboardEvent) {
    const files = imageFiles(event.clipboardData?.files)
    if (files.length === 0) return
    event.preventDefault()
    void insertUploads(files)
}

const editor = useEditor({
    content: model.value,
    contentType: 'markdown',
    extensions: [
        StarterKit.configure({
            heading: { levels: [2, 3, 4] },
            link: {
                openOnClick: false,
                autolink: true,
                protocols: ['http', 'https', 'mailto'],
            },
        }),
        Image,
        Markdown,
    ],
    editorProps: {
        attributes: {
            class: 'blog-prose min-h-[24rem] px-4 py-3 focus:outline-none',
            'aria-label': 'Post body',
            'data-testid': 'blog-editor-rich',
        },
        handlePaste: (_view, event) => {
            const files = imageFiles(event.clipboardData?.files)
            if (files.length === 0) return false
            event.preventDefault()
            void insertUploads(files)
            return true
        },
        handleDrop: (view, event, _slice, moved) => {
            if (moved) return false
            const files = imageFiles(event.dataTransfer?.files)
            if (files.length === 0) return false
            event.preventDefault()
            const at = view.posAtCoords({ left: event.clientX, top: event.clientY })
            void insertUploads(files, at?.pos)
            return true
        },
    },
    onUpdate: ({ editor: e }) => {
        model.value = e.getMarkdown()
    },
})

function toggleMarkdown() {
    const e = editor.value
    if (!markdownMode.value) {
        raw.value = e ? e.getMarkdown() : model.value
        markdownMode.value = true
        return
    }
    model.value = raw.value
    e?.commands.setContent(raw.value, { contentType: 'markdown', emitUpdate: false })
    markdownMode.value = false
}

function onRawInput() {
    model.value = raw.value
}

function setLink() {
    const e = editor.value
    if (!e) return
    const previous = e.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL (leave empty to remove the link)', previous ?? 'https://')
    if (url === null) return
    if (url.trim() === '') {
        e.chain().focus().extendMarkRange('link').unsetLink().run()
        return
    }
    e.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
}

function addImage() {
    const e = editor.value
    if (!e) return
    const url = window.prompt('Image URL')
    if (!url || url.trim() === '') return
    const alt = window.prompt('Image description (alt text)') ?? ''
    e.chain().focus().setImage({ src: url.trim(), alt: alt.trim() }).run()
}

type Action = {
    label: string
    title: string
    run: () => void
    active?: () => boolean
}

const actions: Action[] = [
    { label: 'H2', title: 'Heading 2', run: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(), active: () => !!editor.value?.isActive('heading', { level: 2 }) },
    { label: 'H3', title: 'Heading 3', run: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run(), active: () => !!editor.value?.isActive('heading', { level: 3 }) },
    { label: 'B', title: 'Bold', run: () => editor.value?.chain().focus().toggleBold().run(), active: () => !!editor.value?.isActive('bold') },
    { label: 'I', title: 'Italic', run: () => editor.value?.chain().focus().toggleItalic().run(), active: () => !!editor.value?.isActive('italic') },
    { label: 'Link', title: 'Link', run: setLink, active: () => !!editor.value?.isActive('link') },
    { label: '• List', title: 'Bullet list', run: () => editor.value?.chain().focus().toggleBulletList().run(), active: () => !!editor.value?.isActive('bulletList') },
    { label: '1. List', title: 'Numbered list', run: () => editor.value?.chain().focus().toggleOrderedList().run(), active: () => !!editor.value?.isActive('orderedList') },
    { label: 'Quote', title: 'Quote', run: () => editor.value?.chain().focus().toggleBlockquote().run(), active: () => !!editor.value?.isActive('blockquote') },
    { label: 'Code', title: 'Inline code', run: () => editor.value?.chain().focus().toggleCode().run(), active: () => !!editor.value?.isActive('code') },
    { label: 'Code block', title: 'Code block', run: () => editor.value?.chain().focus().toggleCodeBlock().run(), active: () => !!editor.value?.isActive('codeBlock') },
    { label: 'Image', title: 'Image by URL', run: addImage },
]

onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
    <div
        class="overflow-hidden rounded-md border bg-gray-950"
        :class="props.invalid ? 'border-control-danger' : 'border-gray-700'"
        data-testid="blog-editor"
    >
        <div class="flex flex-wrap items-center gap-1 border-b border-gray-800 bg-gray-900 px-2 py-1.5" role="toolbar" aria-label="Formatting">
            <template v-if="!markdownMode">
                <button
                    v-for="action in actions"
                    :key="action.title"
                    type="button"
                    :title="action.title"
                    :aria-label="action.title"
                    :aria-pressed="action.active ? action.active() : undefined"
                    class="rounded px-2 py-1 text-xs transition"
                    :class="action.active && action.active()
                        ? 'bg-gray-700 text-gray-100'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'"
                    @mousedown.prevent
                    @click="action.run"
                >
                    {{ action.label }}
                </button>
            </template>
            <span v-else class="px-2 py-1 text-xs text-gray-500">Editing raw Markdown</span>
            <button
                type="button"
                title="Upload image"
                aria-label="Upload image"
                class="rounded px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
                @mousedown.prevent
                @click="chooseFiles"
            >
                Upload image
            </button>
            <span v-if="uploading > 0" class="px-2 py-1 text-xs text-gray-400" role="status" data-testid="blog-editor-uploading">
                Uploading…
            </span>
            <input
                ref="fileInput"
                type="file"
                class="hidden"
                :accept="BLOG_IMAGE_ACCEPT"
                multiple
                data-testid="blog-editor-file"
                @change="onFilesChosen"
            />
            <button
                type="button"
                class="ml-auto rounded px-2 py-1 text-xs transition"
                :class="markdownMode ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800'"
                :aria-pressed="markdownMode"
                @click="toggleMarkdown"
            >
                Markdown
            </button>
        </div>

        <textarea
            v-if="markdownMode"
            ref="markdownInput"
            v-model="raw"
            aria-label="Markdown source"
            data-testid="blog-editor-markdown"
            spellcheck="false"
            class="block min-h-[24rem] w-full resize-y border-0 bg-gray-950 px-4 py-3 font-mono text-sm text-gray-200 focus:outline-none focus:ring-0"
            @input="onRawInput"
            @drop="onMarkdownDrop"
            @paste="onMarkdownPaste"
        />
        <EditorContent v-show="!markdownMode" :editor="editor" />
    </div>
</template>
