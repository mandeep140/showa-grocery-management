import Image from 'next/image'

const ClientTopAvatar = () => {
  return (
    <div className='pointer-events-none fixed right-5 top-4 z-40 sm:right-7'>
      <Image
        src='/svg/avatar.svg'
        alt='User avatar'
        width={36}
        height={36}
        className='h-9 w-9 rounded-full object-cover shadow-[0_1px_2px_rgba(0,0,0,0.1)]'
      />
    </div>
  )
}

export default ClientTopAvatar
