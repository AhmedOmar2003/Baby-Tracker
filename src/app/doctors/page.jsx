import { host } from '@/Components/utils/Host';
import DoctorsClient from '@/Components/Doctors/DoctorsClient';

export default function Doctors() {
  return (
    <DoctorsClient host={`${host}/doctor/getAll`} />
  );
}
