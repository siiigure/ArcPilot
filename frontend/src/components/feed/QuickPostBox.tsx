import { LayoutGrid, MessageSquare, Plus, User } from "lucide-react"

export const QuickPostBox = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          <User className="h-full w-full p-2 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="你想分享什么？"
          className="flex-grow bg-[#F1F2F2] border border-gray-200 rounded-full py-2 px-4 text-sm focus:outline-none hover:bg-gray-200 transition-colors cursor-pointer"
        />
      </div>
      <div className="flex justify-around pt-2 border-t border-gray-50 text-gray-500 text-sm">
        <button
          type="button"
          className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors"
        >
          <MessageSquare className="h-4 w-4" /> 提问
        </button>
        <button
          type="button"
          className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors"
        >
          <LayoutGrid className="h-4 w-4" /> 回答
        </button>
        <button
          type="button"
          className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" /> 发布
        </button>
      </div>
    </div>
  )
}
