import React, { useContext, useEffect } from 'react'
import clsx from 'clsx'

import { TilemapType } from '../../types/tilemap'
import { EditorContext } from '../../contexts/ToolContext'
import { TilemapEditorCursor } from './Cursor'
import { clamp } from '../../utils/clamp'
import { Tile } from './Tile'

export interface Props {
  tilemap: TilemapType
  onTileClick: (args: {
    tileX: number
    tileY: number
    tilesetX: number
    tilesetY: number
    tilesetName: string
  }) => void
}

export function TilemapEditor({ tilemap, onTileClick }: Props) {
  const [ref, setRef] = React.useState<HTMLDivElement | null>(null)
  const [{ tool, showGrid, cursorRef, zoomLevel }, { setZoomLevel }] =
    useContext(EditorContext)
  const [leftMouseButtonIsDown, setLeftMouseButtonIsDown] =
    React.useState(false)
  const [middleMouseButtonIsDown, setMiddleMouseButtonIsDown] =
    React.useState(false)

  useEffect(
    function registerEventListeners() {
      let prevX = 0
      let prevY = 0

      function handleMouseDown(e: MouseEvent) {
        if (e.button === 0) {
          setLeftMouseButtonIsDown(true)
        } else if (e.button === 1) {
          prevX = e.x
          prevY = e.y
          setMiddleMouseButtonIsDown(true)
        }
      }

      function handleMouseUp(e: MouseEvent) {
        if (e.button === 0) {
          setLeftMouseButtonIsDown(false)
        } else if (e.button === 1) {
          setMiddleMouseButtonIsDown(false)
        }
      }

      function handleMouseMove(e: MouseEvent) {
        if (
          leftMouseButtonIsDown &&
          e.target instanceof HTMLDivElement &&
          e.target.dataset.type === 'tile'
        ) {
          handleLeftMouseButtonClick(e)
        }

        if (middleMouseButtonIsDown) {
          if (ref) {
            const top = Number(ref.style.top?.split('px')?.[0] || ref.offsetTop)
            const left = Number(
              ref.style.left?.split('px')?.[0] || ref.offsetLeft
            )

            const deltaX = -clamp(prevX - e.x, -10, 10)
            const deltaY = -clamp(prevY - e.y, -10, 10)

            ref.style.left = `${left + deltaX}px`
            ref.style.top = `${top + deltaY}px`

            prevX = e.x
            prevY = e.y
          }
        }
      }

      function handleLeftMouseButtonClick(e: MouseEvent) {
        if (
          e.target instanceof HTMLDivElement &&
          e.target.dataset.type === 'tile'
        ) {
          const img = e.target.querySelector('img')

          if (!img) return

          const cursorX = Math.floor((cursorRef?.offsetLeft ?? 0) / 32)
          const cursorY = Math.floor((cursorRef?.offsetTop ?? 0) / 32)

          if (
            cursorX < 0 ||
            cursorX > tilemap.width - 1 ||
            cursorY < 0 ||
            cursorY > tilemap.height - 1
          )
            return

          if (tool.type === 'tile') {
            onTileClick({
              tileX: cursorX,
              tileY: cursorY,
              tilesetX: tool.tilesetX ?? -1,
              tilesetY: tool.tilesetY ?? -1,
              tilesetName: tool.tilesetName ?? 'unknown',
            })

            img.src = tool.canvas.toDataURL()
          } else if (tool.type === 'eraser') {
            onTileClick({
              tileX: cursorX,
              tileY: cursorY,
              tilesetX: -1,
              tilesetY: -1,
              tilesetName: '',
            })

            img.src = ''
          }
        }
      }

      function handleMouseWheel(e: WheelEvent) {
        if (
          e.target instanceof HTMLDivElement &&
          (e.target?.id === 'tilemap-editor' ||
            e.target?.id === 'tilemap-grid' ||
            e.target.dataset?.['type'] === 'tile')
        ) {
          const delta = e.deltaY

          if (delta > 0) {
            setZoomLevel(zoomLevel - 0.1 * zoomLevel)
          } else if (delta < 0) {
            setZoomLevel(zoomLevel + 0.1 * zoomLevel)
          }
        }
      }

      document.addEventListener('click', handleLeftMouseButtonClick)
      document.addEventListener('mousedown', handleMouseDown)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('wheel', handleMouseWheel)

      return () => {
        document.removeEventListener('click', handleLeftMouseButtonClick)
        document.removeEventListener('mousedown', handleMouseDown)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('wheel', handleMouseWheel)
      }
    },
    [
      leftMouseButtonIsDown,
      middleMouseButtonIsDown,
      tool,
      cursorRef,
      onTileClick,
      zoomLevel,
    ]
  )

  return (
    <div
      id="tilemap-editor"
      className="items-center flex justify-center bg-gray-300 relative h-[calc(100%-3.5rem-1px)]"
    >
      <div
        ref={(el) => setRef(el)}
        id="tilemap-grid"
        className={clsx(
          'grid border-l border-b border-black border-opacity-10 absolute',
          {
            'border-r border-t': !showGrid,
          }
        )}
        style={{
          gridTemplateColumns: `repeat(${tilemap.width}, ${tilemap.tileWidth}px)`,
          gridTemplateRows: `repeat(${tilemap.height}, ${tilemap.tileHeight}px)`,
          zoom: zoomLevel,
        }}
      >
        <TilemapEditorCursor anchor={ref} tilemap={tilemap} />
        {tilemap.data.map((row, y) => {
          return row.map((tile, x) => {
            return (
              <Tile
                key={`${x}-${y}`}
                x={x}
                y={y}
                tileWidth={tilemap.tileWidth}
                tileHeight={tilemap.tileHeight}
                showGrid={showGrid}
              />
            )
          })
        })}
      </div>
    </div>
  )
}