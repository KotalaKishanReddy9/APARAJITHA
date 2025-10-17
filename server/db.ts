// Enhanced in-memory mock database with accurate filtering and joins
import * as schema from "@shared/schema";

// Mock database implementation with proper data structure
const mockData: Record<string, any[]> = {
  users: [],
  courses: [],
  enrollments: [],
  assignments: [],
  submissions: [],
  grades: [],
  discussions: [],
  materials: [],
  notifications: []
};

// Generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Get table name from schema reference
function getTableName(table: any): string {
  if (table === schema.users) return 'users';
  if (table === schema.courses) return 'courses';
  if (table === schema.enrollments) return 'enrollments';
  if (table === schema.assignments) return 'assignments';
  if (table === schema.submissions) return 'submissions';
  if (table === schema.grades) return 'grades';
  if (table === schema.discussions) return 'discussions';
  if (table === schema.materials) return 'materials';
  if (table === schema.notifications) return 'notifications';
  return 'unknown';
}

// Parse drizzle conditions for filtering with session context
function parseCondition(condition: any, record: any, session?: any): boolean {
  if (!condition) return true;
  
  // Handle different types of conditions
  if (typeof condition === 'function') {
    try {
      return condition(record);
    } catch {
      return true;
    }
  }
  
  // Handle drizzle condition objects
  if (condition && typeof condition === 'object') {
    // Simple field equality check
    if (condition.column && condition.value !== undefined) {
      return record[condition.column] === condition.value;
    }
    
    // Handle SQL-like conditions with better parsing
    if (condition.sql) {
      const sql = condition.sql.toLowerCase();
      const params = condition.params || [];
      
      // Handle equality conditions (= $1)
      if (sql.includes('= $1') && params.length >= 1) {
        const fieldPart = sql.split('= $1')[0].trim();
        const fieldName = fieldPart.replace(/["\']/g, '').split('.').pop(); // Handle table.field format
        return record[fieldName] === params[0];
      }
      
      // Handle AND conditions
      if (sql.includes(' and ')) {
        const parts = sql.split(' and ');
        return parts.every((part: string) => {
          const subCondition = { sql: part, params };
          return parseCondition(subCondition, record, session);
        });
      }
      
      // Handle IN conditions
      if (sql.includes(' in (') && sql.includes(')')) {
        const fieldMatch = sql.match(/^"?([^"]+)"?\s+in\s*\(/i);
        if (fieldMatch) {
          const fieldName = fieldMatch[1].split('.').pop();
          const fieldValue = record[fieldName];
          return params.includes(fieldValue);
        }
      }
      
      // Handle LIKE conditions
      if (sql.includes(' like ')) {
        const parts = sql.split(' like ');
        if (parts.length === 2) {
          const fieldName = parts[0].trim().replace(/["\']/g, '').split('.').pop();
          const pattern = params[0] || parts[1].replace(/'/g, '');
          const value = record[fieldName] || '';
          return value.toLowerCase().includes(pattern.replace(/%/g, '').toLowerCase());
        }
      }
    }
    
    // Handle composite conditions (AND/OR operations)
    if (condition.type) {
      switch (condition.type) {
        case 'and':
          return condition.conditions?.every((cond: any) => parseCondition(cond, record, session)) ?? true;
        case 'or':
          return condition.conditions?.some((cond: any) => parseCondition(cond, record, session)) ?? true;
      }
    }
  }
  
  return true;
}

// Enhanced join operation
function performJoin(
  leftData: any[],
  rightTableName: string,
  joinCondition?: any
): any[] {
  const rightData = mockData[rightTableName] || [];
  
  return leftData.map(leftRecord => {
    const result = { ...leftRecord };
    
    // Determine join relationship
    let rightRecord;
    
    switch (rightTableName) {
      case 'users':
        // Join users as teachers for courses, or as students for enrollments
        if (leftRecord.teacherId) {
          rightRecord = rightData.find(r => r.id === leftRecord.teacherId);
          if (rightRecord) {
            result.teacher = { name: rightRecord.name };
          }
        } else if (leftRecord.studentId) {
          rightRecord = rightData.find(r => r.id === leftRecord.studentId);
          if (rightRecord) {
            result.student = { name: rightRecord.name, email: rightRecord.email };
          }
        } else if (leftRecord.userId) {
          rightRecord = rightData.find(r => r.id === leftRecord.userId);
          if (rightRecord) {
            result.user = { name: rightRecord.name };
          }
        }
        break;
        
      case 'courses':
        // Join courses for enrollments or assignments
        if (leftRecord.courseId) {
          rightRecord = rightData.find(r => r.id === leftRecord.courseId);
          if (rightRecord) {
            result.course = { ...rightRecord };
          }
        }
        break;
        
      case 'assignments':
        // Join assignments for submissions
        if (leftRecord.assignmentId) {
          rightRecord = rightData.find(r => r.id === leftRecord.assignmentId);
          if (rightRecord) {
            result.assignment = { ...rightRecord };
          }
        }
        break;
        
      case 'submissions':
        // Join submissions for grades
        if (leftRecord.submissionId) {
          rightRecord = rightData.find(r => r.id === leftRecord.submissionId);
          if (rightRecord) {
            result.submission = { ...rightRecord };
          }
        }
        break;
    }
    
    return result;
  });
}

// Enhanced MockQuery class with accurate data operations
class MockQuery {
  private tableName: string;
  private data: any[];
  private selectedFields: any;
  private joins: Array<{tableName: string, condition?: any}> = [];
  private whereConditions: any[] = [];
  private limitCount?: number;
  private orderByFields: Array<{field: string, direction: 'asc' | 'desc'}> = [];

  constructor(table: any, fields?: any) {
    this.tableName = getTableName(table);
    // Always work with fresh data copy
    this.data = JSON.parse(JSON.stringify(mockData[this.tableName] || []));
    this.selectedFields = fields;
  }

  where(condition: any) {
    if (!condition) return this;
    
    this.whereConditions.push(condition);
    this.data = this.data.filter(record => parseCondition(condition, record));
    return this;
  }

  leftJoin(joinTable: any, joinCondition?: any) {
    const joinTableName = getTableName(joinTable);
    this.joins.push({ tableName: joinTableName, condition: joinCondition });
    return this;
  }

  orderBy(field: any, direction: 'asc' | 'desc' = 'asc') {
    this.orderByFields.push({ field: field?.name || field, direction });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  // Execute the query and return results as a proper Promise
  then<TResult1 = any[], TResult2 = never>(
    onfulfilled?: ((value: any[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return new Promise<any[]>((resolve, reject) => {
      try {
        let result = [...this.data];

        // Apply joins
        for (const join of this.joins) {
          result = performJoin(result, join.tableName, join.condition);
        }

        // Apply ordering
        if (this.orderByFields.length > 0) {
          result.sort((a: any, b: any) => {
            for (const orderBy of this.orderByFields) {
              const aVal = this.getNestedValue(a, orderBy.field);
              const bVal = this.getNestedValue(b, orderBy.field);
              
              if (aVal < bVal) return orderBy.direction === 'asc' ? -1 : 1;
              if (aVal > bVal) return orderBy.direction === 'asc' ? 1 : -1;
            }
            return 0;
          });
        }

        // Apply limit
        if (this.limitCount) {
          result = result.slice(0, this.limitCount);
        }

        // Apply field selection if specified
        if (this.selectedFields && typeof this.selectedFields === 'object') {
          result = result.map((record: any) => {
            const selectedRecord: any = {};
            
            for (const [key, value] of Object.entries(this.selectedFields)) {
              if (typeof value === 'object' && value !== null) {
                // Handle nested selections like { teacher: { name: users.name } }
                selectedRecord[key] = {};
                for (const [nestedKey, nestedValue] of Object.entries(value as any)) {
                  const sourceValue = this.getNestedValue(record, nestedValue);
                  selectedRecord[key][nestedKey] = sourceValue;
                }
              } else {
                // Handle direct field selections
                selectedRecord[key] = this.getNestedValue(record, value);
              }
            }
            
            return selectedRecord;
          });
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    }).then(onfulfilled, onrejected);
  }

  // Get nested value from object path
  private getNestedValue(obj: any, path: any): any {
    if (!path) return obj;
    
    if (typeof path === 'string') {
      return obj[path];
    }
    
    if (path.name) {
      return obj[path.name];
    }
    
    return obj;
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<any[] | TResult> {
    return this.then(undefined, onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<any[]> {
    return this.then(
      (value) => {
        if (onfinally) onfinally();
        return value;
      },
      (reason) => {
        if (onfinally) onfinally();
        throw reason;
      }
    );
  }
}

// Enhanced database interface with proper CRUD operations
export const db = {
  select: (fields?: any) => ({
    from: (table: any) => new MockQuery(table, fields)
  }),
  
  insert: (table: any) => ({
    values: (data: any) => ({
      returning: () => {
        const tableName = getTableName(table);
        const now = new Date().toISOString();
        
        const newRecord = { 
          ...data, 
          id: generateId(),
          createdAt: data.createdAt || now,
          // Add conditional timestamps based on table
          ...(tableName === 'enrollments' && { enrolledAt: now }),
          ...(tableName === 'submissions' && { submittedAt: now }),
          ...(tableName === 'grades' && { gradedAt: now }),
          ...(tableName === 'materials' && { uploadedAt: now })
        };
        
        mockData[tableName].push(newRecord);
        console.log(`✅ Added to ${tableName}:`, {
          id: newRecord.id,
          ...Object.fromEntries(
            Object.entries(newRecord).filter(([key]) => 
              !['password', 'createdAt', 'enrolledAt', 'submittedAt', 'gradedAt', 'uploadedAt'].includes(key)
            )
          )
        });
        
        return Promise.resolve([newRecord]);
      }
    })
  }),
  
  update: (table: any) => ({
    set: (updateData: any) => ({
      where: (condition: any) => {
        const tableName = getTableName(table);
        const records = mockData[tableName] || [];
        
        let updatedCount = 0;
        
        // Find and update matching records
        records.forEach(record => {
          if (parseCondition(condition, record)) {
            Object.assign(record, updateData);
            updatedCount++;
          }
        });
        
        console.log(`📝 Updated ${updatedCount} record(s) in ${tableName}`);
        return Promise.resolve({ updatedCount });
      }
    })
  }),
  
  delete: (table: any) => ({
    where: (condition: any) => {
      const tableName = getTableName(table);
      const records = mockData[tableName] || [];
      
      const initialLength = records.length;
      mockData[tableName] = records.filter(record => !parseCondition(condition, record));
      const deletedCount = initialLength - mockData[tableName].length;
      
      console.log(`🗑️ Deleted ${deletedCount} record(s) from ${tableName}`);
      return Promise.resolve({ deletedCount });
    }
  })
};

// Export utility functions
export function getMockData() {
  return mockData;
}

export function clearMockData() {
  Object.keys(mockData).forEach(key => {
    mockData[key] = [];
  });
}

export function setMockData(newData: Record<string, any[]>) {
  Object.assign(mockData, newData);
}

// Initialize with sample data for demo
function initializeSampleData() {
  // Add sample teacher
  const teacherId = generateId();
  mockData.users.push({
    id: teacherId,
    name: 'Dr. Jane Smith',
    email: 'teacher@example.com',
    password: 'hashed_password',
    role: 'teacher',
    createdAt: new Date().toISOString()
  });

  // Add sample student for testing
  const studentId = generateId();
  mockData.users.push({
    id: studentId,
    name: 'John Student',
    email: 'student@example.com',
    password: 'hashed_password',
    role: 'student',
    createdAt: new Date().toISOString()
  });

  // Add sample courses
  const courseIds = [];
  for (let i = 1; i <= 3; i++) {
    const courseId = generateId();
    courseIds.push(courseId);
    mockData.courses.push({
      id: courseId,
      title: `Course ${i}: Introduction to Subject ${i}`,
      description: `Learn the fundamentals of Subject ${i}`,
      duration: `${4 + i} weeks`,
      teacherId: teacherId,
      createdAt: new Date().toISOString()
    });
  }

  // Add sample enrollments
  courseIds.slice(0, 2).forEach((courseId) => {
    const enrollmentId = generateId();
    mockData.enrollments.push({
      id: enrollmentId,
      studentId: studentId,
      courseId: courseId,
      enrolledAt: new Date().toISOString()
    });
  });

  // Add sample assignments
  courseIds.forEach((courseId, index) => {
    const assignmentId = generateId();
    mockData.assignments.push({
      id: assignmentId,
      courseId: courseId,
      title: `Assignment ${index + 1}`,
      instructions: `Complete the tasks for Assignment ${index + 1}`,
      dueDate: new Date(Date.now() + (7 + index) * 24 * 60 * 60 * 1000).toISOString(), // Due in 7+ days
      createdAt: new Date().toISOString()
    });
  });

  // Add sample notifications
  const notificationId = generateId();
  mockData.notifications.push({
    id: notificationId,
    userId: studentId,
    type: 'Welcome',
    content: 'Welcome to EduLearn! Start exploring courses.',
    isRead: false,
    createdAt: new Date().toISOString()
  });
}

initializeSampleData();
console.log('✅ Mock database initialized with sample data');

// Mock pool for session store compatibility
export const pool = { query: () => Promise.resolve({ rows: [] }) };
