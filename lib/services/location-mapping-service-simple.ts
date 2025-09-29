import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class LocationMappingService {
  async mapLocation(address: string, createMissing: boolean = true) {
    if (!address) return null

    // البحث عن سوريا ودمشق كافتراضي
    let country = await prisma.country.findUnique({
      where: { code: 'sy' }
    })

    if (!country && createMissing) {
      country = await prisma.country.create({
        data: {
          code: 'sy',
          name: 'سوريا',
          flag: '🇸🇾',
          description: 'دليل الشركات في سوريا',
          companiesCount: 0
        }
      })
    }

    if (!country) return null

    // البحث عن دمشق
    let city = await prisma.city.findUnique({
      where: { slug: 'damascus' }
    })

    if (!city && createMissing) {
      city = await prisma.city.create({
        data: {
          slug: 'damascus',
          name: 'دمشق',
          countryId: country.id,
          countryCode: 'sy',
          description: 'عاصمة سوريا',
          companiesCount: 0
        }
      })
    }

    if (!city) return null

    return {
      country: {
        id: country.id,
        code: country.code,
        name: country.name
      },
      city: {
        id: city.id,
        slug: city.slug,
        name: city.name
      }
    }
  }
}
