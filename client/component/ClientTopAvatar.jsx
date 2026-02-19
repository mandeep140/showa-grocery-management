import Image from 'next/image'

const ClientTopAvatar = () => {
  return (
    <div className='fixed right-5 top-3 z-40 flex items-center gap-3 rounded-full bg-[#EAF4F3] px-3 py-1.5 sm:right-7'>
      <div className='text-right leading-tight'>
        <p className='text-[15px] font-semibold text-[#2E3D43]'>Admin 1</p>
        <p className='text-xs font-medium text-[#7D9198]'>Admin</p>
      </div>
      <Image
        src='/svg/avatar.svg'
        alt='User avatar'
        width={38}
        height={38}
        className='h-9 w-9 rounded-full border border-[#D4E4E3] bg-white object-cover'
      />
    </div>
  )
}

export default ClientTopAvatar
