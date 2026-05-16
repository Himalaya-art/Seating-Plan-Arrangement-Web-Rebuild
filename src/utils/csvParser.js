export function parseStudentsCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const students = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(/[,，\t]/);
    if (parts.length < 2) continue;

    const name = parts[0].trim();
    const genderRaw = parts[1].trim();

    let gender;
    if (genderRaw === '男' || genderRaw === 'M' || genderRaw === 'm' || genderRaw === 'male') {
      gender = '男';
    } else if (genderRaw === '女' || genderRaw === 'F' || genderRaw === 'f' || genderRaw === 'female') {
      gender = '女';
    } else {
      continue;
    }

    if (name) {
      students.push({ name, gender });
    }
  }

  return students;
}

export function studentsToCSV(students) {
  return '姓名,性别\n' + students.map(s => `${s.name},${s.gender}`).join('\n');
}
