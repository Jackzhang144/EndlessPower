import { useMemo, useState } from 'react'
import { Button, ButtonGroup, Chip, Modal } from '@heroui/react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { FitIcon, MinusIcon, PlusIcon } from './icons'

type CampusMapModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function CampusMapModal({ isOpen, onClose }: CampusMapModalProps) {
  const [scale, setScale] = useState(1)
  const zoomLabel = useMemo(() => `${Math.round(scale * 100)}%`, [scale])

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container placement="center" size="full" scroll="inside">
          <Modal.Dialog className="campus-dialog">
            <Modal.Header className="app-modal-header campus-header">
              <div className="campus-header-title">
                <Modal.Heading>校园地图</Modal.Heading>
                <div className="campus-subtitle">双指缩放 · 拖动浏览</div>
              </div>
              <Modal.CloseTrigger aria-label="关闭" />
            </Modal.Header>
            <Modal.Body className="campus-body">
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={5}
                centerOnInit
                limitToBounds={false}
                doubleClick={{ mode: 'zoomIn', disabled: false }}
                pinch={{ disabled: false }}
                panning={{ disabled: false }}
                wheel={{ step: 0.14 }}
                onTransformed={(_ref, state) => setScale(state.scale)}
              >
                {({ zoomIn, zoomOut, resetTransform, centerView }) => (
                  <div className="campus-stage" role="img" aria-label="校园地图，可缩放拖动查看">
                    <TransformComponent wrapperClass="campus-transform" contentClass="campus-transform-content">
                      <img className="campus-image" src="/map.jpg" alt="校园地图" draggable={false} />
                    </TransformComponent>

                    <div className="campus-controls" aria-label="缩放控制">
                      <Chip variant="secondary" size="sm" className="campus-zoom-chip">
                        {zoomLabel}
                      </Chip>
                      <ButtonGroup variant="secondary" size="md" className="campus-controls-group" hideSeparator>
                        <Button isIconOnly aria-label="缩小" onPress={() => zoomOut(0.4, 180)}>
                          <MinusIcon size={18} />
                        </Button>
                        <Button isIconOnly aria-label="放大" onPress={() => zoomIn(0.4, 180)}>
                          <PlusIcon size={18} />
                        </Button>
                        <Button
                          isIconOnly
                          aria-label="适应屏幕"
                          onPress={() => {
                            resetTransform(180)
                            centerView(1, 180)
                          }}
                        >
                          <FitIcon size={18} />
                        </Button>
                      </ButtonGroup>
                    </div>
                  </div>
                )}
              </TransformWrapper>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
