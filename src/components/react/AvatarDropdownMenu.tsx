// components/AvatarDropdownMenu.jsx
import { Avatar } from '@nextui-org/avatar'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/dropdown'

export const AvatarDropdownMenu = ({
  src,
  alt,
  fallbackText
}: {
  src: string
  alt: string
  fallbackText: string
}) => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Avatar isBordered src={src} alt={alt} name={fallbackText} />
      </DropdownTrigger>
      <DropdownMenu>
        <DropdownItem>Profile</DropdownItem>
        <DropdownItem>Settings</DropdownItem>
        <DropdownItem>Logout</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}
