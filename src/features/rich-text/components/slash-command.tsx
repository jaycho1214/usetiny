"use client";

import { Extension, type Editor, type Range } from "@tiptap/react";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, {
  type SuggestionOptions,
  type SuggestionProps,
  type SuggestionKeyDownProps,
} from "@tiptap/suggestion";
import {
  computePosition,
  flip,
  offset as fuiOffset,
  shift,
  type VirtualElement,
} from "@floating-ui/dom";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Table as TableIcon,
  ChevronDownSquare,
  Video as YoutubeIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SlashItem {
  title: string;
  description: string;
  icon: LucideIcon;
  aliases?: string[];
  command: (ctx: { editor: Editor; range: Range }) => void;
}

const SLASH_ITEMS: SlashItem[] = [
  {
    title: "Heading 1",
    description: "Big section heading",
    icon: Heading1,
    aliases: ["h1", "title"],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 1 })
        .run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    aliases: ["h2"],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 2 })
        .run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    aliases: ["h3"],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 3 })
        .run(),
  },
  {
    title: "Bullet list",
    description: "Simple bulleted list",
    icon: List,
    aliases: ["ul", "bullet"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Numbered list",
    description: "Ordered list",
    icon: ListOrdered,
    aliases: ["ol", "ordered"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Task list",
    description: "Checkable to-dos",
    icon: ListTodo,
    aliases: ["todo", "checkbox", "task"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: "Code block",
    description: "Capture a snippet",
    icon: Code2,
    aliases: ["code", "snippet"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Quote",
    description: "Block quote",
    icon: Quote,
    aliases: ["blockquote"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    icon: Minus,
    aliases: ["hr", "rule", "separator"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: "Image",
    description: "Embed by URL",
    icon: ImageIcon,
    aliases: ["img", "picture"],
    command: ({ editor, range }) => {
      const url = window.prompt("Image URL");
      if (!url) return;
      editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
    },
  },
  {
    title: "Table",
    description: "3×3 with header row",
    icon: TableIcon,
    aliases: ["grid"],
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    title: "YouTube",
    description: "Embed a video by URL",
    icon: YoutubeIcon,
    aliases: ["video", "yt"],
    command: ({ editor, range }) => {
      const url = window.prompt("YouTube URL");
      if (!url) return;
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setYoutubeVideo({ src: url })
        .run();
    },
  },
  {
    title: "Details",
    description: "Collapsible block",
    icon: ChevronDownSquare,
    aliases: ["collapse", "toggle"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setDetails().run(),
  },
];

function filterItems(query: string): SlashItem[] {
  if (!query) return SLASH_ITEMS;
  const q = query.toLowerCase();
  return SLASH_ITEMS.filter((item) => {
    if (item.title.toLowerCase().includes(q)) return true;
    if (item.aliases?.some((alias) => alias.toLowerCase().includes(q)))
      return true;
    return false;
  });
}

interface SlashMenuListHandle {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

interface SlashMenuListProps {
  items: SlashItem[];
  command: (item: SlashItem) => void;
}

const SlashMenuList = forwardRef<SlashMenuListHandle, SlashMenuListProps>(
  function SlashMenuList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [prevItems, setPrevItems] = useState(items);
    if (prevItems !== items) {
      setPrevItems(items);
      setSelectedIndex(0);
    }
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
    useEffect(() => {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    }, [selectedIndex]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          const item = items[selectedIndex];
          if (item) {
            command(item);
            return true;
          }
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="w-64 rounded-md border bg-popover p-2 text-sm text-muted-foreground shadow-md">
          No results
        </div>
      );
    }

    return (
      <div className="max-h-72 w-64 overflow-y-auto rounded-md border bg-popover p-1 text-sm shadow-md">
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = index === selectedIndex;
          return (
            <button
              key={item.title}
              type="button"
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              onClick={() => command(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left",
                active && "bg-accent text-accent-foreground",
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-sm border bg-background">
                <Icon className="size-3.5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{item.title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    );
  },
);

const slashSuggestion: Omit<SuggestionOptions<SlashItem>, "editor"> = {
  char: "/",
  startOfLine: false,
  allowSpaces: false,
  items: ({ query }) => filterItems(query),
  command: ({ editor, range, props }) => {
    props.command({ editor, range });
  },
  render: () => {
    let renderer: ReactRenderer<
      SlashMenuListHandle,
      SlashMenuListProps
    > | null = null;
    let popupEl: HTMLDivElement | null = null;
    let cleanup: (() => void) | null = null;

    const positionPopup = (
      clientRect: (() => DOMRect | null) | null | undefined,
    ) => {
      if (!popupEl || !clientRect) return;
      const rect = clientRect();
      if (!rect) return;
      const virtual: VirtualElement = {
        getBoundingClientRect: () => rect,
      };
      computePosition(virtual, popupEl, {
        placement: "bottom-start",
        middleware: [fuiOffset(6), flip(), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        if (!popupEl) return;
        popupEl.style.left = `${x}px`;
        popupEl.style.top = `${y}px`;
      });
    };

    return {
      onStart: (props: SuggestionProps<SlashItem>) => {
        renderer = new ReactRenderer(SlashMenuList, {
          props: {
            items: props.items,
            command: (item: SlashItem) => props.command(item),
          },
          editor: props.editor,
        });
        popupEl = document.createElement("div");
        popupEl.style.position = "absolute";
        popupEl.style.left = "0";
        popupEl.style.top = "0";
        popupEl.style.zIndex = "50";
        popupEl.appendChild(renderer.element);
        document.body.appendChild(popupEl);
        positionPopup(props.clientRect);

        const onScroll = () => positionPopup(props.clientRect);
        window.addEventListener("scroll", onScroll, true);
        window.addEventListener("resize", onScroll);
        cleanup = () => {
          window.removeEventListener("scroll", onScroll, true);
          window.removeEventListener("resize", onScroll);
        };
      },
      onUpdate: (props: SuggestionProps<SlashItem>) => {
        renderer?.updateProps({
          items: props.items,
          command: (item: SlashItem) => props.command(item),
        });
        positionPopup(props.clientRect);
      },
      onKeyDown: (props: SuggestionKeyDownProps) => {
        if (props.event.key === "Escape") {
          cleanup?.();
          popupEl?.remove();
          renderer?.destroy();
          renderer = null;
          popupEl = null;
          cleanup = null;
          return true;
        }
        return renderer?.ref?.onKeyDown(props) ?? false;
      },
      onExit: () => {
        cleanup?.();
        popupEl?.remove();
        renderer?.destroy();
        renderer = null;
        popupEl = null;
        cleanup = null;
      },
    };
  },
};

export const SlashCommand = Extension.create({
  name: "slashCommand",
  addOptions() {
    return {
      suggestion: slashSuggestion,
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
