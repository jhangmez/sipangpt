import { Select, SelectItem } from '@nextui-org/select'
import { Server } from '@typescustom/chat'
import { Chip } from '@nextui-org/chip'
interface ServerSelectorProps {
  servers: Server[]
  selectedServer: string
  onServerChange: (server: string) => void
}

export default function ServerSelector({
  servers,
  selectedServer,
  onServerChange
}: ServerSelectorProps) {
  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value || 'local'
    onServerChange(newValue)
  }

  // Aseguramos que siempre haya un valor seleccionado
  const currentSelection = selectedServer || 'local'
  return (
    <Select
      label='Servidor'
      size='sm'
      isRequired
      defaultSelectedKeys={[currentSelection]}
      selectedKeys={[selectedServer]}
      onChange={handleSelectionChange}
      disallowEmptySelection
      className='max-w-xs'
      endContent={
        <Chip size='sm' className='bg-error text-errorContainer'>
          Desconectado
        </Chip>
      }
      startContent={
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='1em'
          height='1em'
          viewBox='0 0 24 24'
        >
          <path
            fill='currentColor'
            d='M2 4.6v4.8c0 .9.5 1.6 1.2 1.6h17.7c.6 0 1.2-.7 1.2-1.6V4.6C22 3.7 21.5 3 20.8 3H3.2C2.5 3 2 3.7 2 4.6M10 8V6H9v2zM5 8h2V6H5zm15 1H4V5h16zM2 14.6v4.8c0 .9.5 1.6 1.2 1.6h17.7c.6 0 1.2-.7 1.2-1.6v-4.8c0-.9-.5-1.6-1.2-1.6H3.2c-.7 0-1.2.7-1.2 1.6m8 3.4v-2H9v2zm-5 0h2v-2H5zm15 1H4v-4h16z'
          />
        </svg>
      }
    >
      {servers.map((server) => (
        <SelectItem key={server.url} value={server.url}>
          {server.name}
        </SelectItem>
      ))}
    </Select>
  )
}
